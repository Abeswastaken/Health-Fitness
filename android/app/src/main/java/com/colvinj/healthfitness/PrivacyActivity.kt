package com.colvinj.healthfitness

import android.app.Activity
import android.os.Bundle
import android.widget.ScrollView
import android.widget.TextView

/** Shown by Health Connect when you ask how this app uses your data. */
class PrivacyActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val text = TextView(this).apply {
            setPadding(48, 64, 48, 48)
            textSize = 16f
            text = """
                Health-Fitness and your health data

                This is a personal app. It reads body weight, heart rate, resting heart rate and sleep from Health Connect to show your trends, estimate workout calories and run coach checks. It writes your workouts (and their calories) back to Health Connect.

                Everything stays on this phone. Nothing is sent anywhere, except text you choose to send to the AI service you set up yourself in Settings.

                You can turn each read or write off in Settings > Health Connect, or remove access in Health Connect at any time.
            """.trimIndent()
        }
        setContentView(ScrollView(this).apply { addView(text) })
    }
}
