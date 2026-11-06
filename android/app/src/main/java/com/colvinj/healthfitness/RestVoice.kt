package com.colvinj.healthfitness

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

/**
 * Spoken rest timer. Runs natively so it keeps time with the screen off:
 * "X seconds remaining" every 30 seconds, "10 seconds", then 3, 2, 1 and a beep.
 * Music dips while it talks instead of stopping.
 */
class RestVoice(context: Context) {
    private val app = context.applicationContext
    private val main = Handler(Looper.getMainLooper())
    private val cues = Handler(Looper.getMainLooper())
    private val audio = app.getSystemService(AudioManager::class.java)
    private val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .build()
    private val focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(attrs).build()
    private var ready = false
    private var talking = 0
    private val wake = app.getSystemService(PowerManager::class.java).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "HealthFitness:rest")
    private val tts: TextToSpeech = TextToSpeech(app) { status ->
        ready = status == TextToSpeech.SUCCESS
        if (ready) {
            tts.language = Locale.US
            tts.setAudioAttributes(attrs)
            tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(id: String?) {}
                override fun onDone(id: String?) = release()
                @Deprecated("old API") override fun onError(id: String?) = release()
                override fun onError(id: String?, code: Int) = release()
            })
        }
    }

    private fun release() {
        main.post { talking = (talking - 1).coerceAtLeast(0); if (talking == 0) audio.abandonAudioFocusRequest(focus) }
    }

    fun say(text: String) {
        if (!ready) return
        talking++
        audio.requestAudioFocus(focus)
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "rest" + System.nanoTime())
    }

    private fun beep() {
        runCatching {
            val tone = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 90)
            tone.startTone(ToneGenerator.TONE_PROP_BEEP2, 400)
            main.postDelayed({ tone.release() }, 600)
        }
    }

    /** Spoken time left, e.g. 90 -> "90 seconds remaining", 120 -> "2 minutes remaining". */
    private fun left(t: Int): String = when {
        t <= 90 -> "$t seconds remaining"
        t % 60 == 0 -> "${t / 60} minutes remaining"
        else -> "${t / 60} minutes ${t % 60} seconds remaining"
    }

    /** Starts (or restarts, after +30 s) a countdown of [seconds]. */
    fun start(seconds: Int) {
        stop()
        if (seconds <= 0) return
        wake.acquire((seconds + 10) * 1000L)
        val list = mutableListOf<Pair<Int, () -> Unit>>()
        var t = (seconds - 1) / 30 * 30
        while (t > 10) { val x = t; list += x to { say(left(x)) }; t -= 30 }
        if (seconds > 10) list += 10 to { say("10 seconds") }
        for (n in 3 downTo 1) if (seconds > n) list += n to { say("$n") }
        list += 0 to { beep(); main.postDelayed({ if (wake.isHeld) wake.release() }, 1500) }
        for ((at, fn) in list) cues.postDelayed(fn, (seconds - at) * 1000L)
    }

    fun stop() {
        cues.removeCallbacksAndMessages(null)
        if (wake.isHeld) wake.release()
    }

    fun shutdown() { stop(); tts.shutdown() }
}
