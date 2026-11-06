package com.colvinj.healthfitness

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject

/**
 * Shot reminders for the Peptides section. The web side sends the upcoming doses
 * [{key, at (ms), until (ms), title, text}]; one exact alarm is set for the next one.
 * A posted reminder comes back (quietly) if it's swiped away, until the dose is
 * logged or skipped in the app, which drops it from the list and clears it.
 */
object Reminders {
    private const val CHANNEL = "shots"
    private const val PREFS = "reminders"
    const val ACTION_FIRE = "com.colvinj.healthfitness.REMINDER_FIRE"
    const val ACTION_REPOST = "com.colvinj.healthfitness.REMINDER_REPOST"
    const val EXTRA_OPEN = "open"

    private fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private fun items(c: Context): List<JSONObject> = runCatching {
        val a = JSONArray(prefs(c).getString("items", "[]")); (0 until a.length()).map { a.getJSONObject(it) }
    }.getOrDefault(emptyList())
    private fun posted(c: Context): MutableSet<String> = prefs(c).getStringSet("posted", emptySet())!!.toMutableSet()
    private fun setPosted(c: Context, s: Set<String>) = prefs(c).edit().putStringSet("posted", s).apply()
    private fun nid(key: String) = key.hashCode()

    /** Replaces the list. Reminders no longer in it are cleared. */
    fun schedule(c: Context, list: JSONArray) {
        prefs(c).edit().putString("items", list.toString()).apply()
        val keys = (0 until list.length()).map { list.getJSONObject(it).getString("key") }.toSet()
        val nm = c.getSystemService(NotificationManager::class.java)
        val still = posted(c)
        still.filter { it !in keys }.forEach { nm.cancel(nid(it)) }
        still.retainAll(keys); setPosted(c, still)
        // Opened from the app: past doses are on screen already, so only future ones get alarms.
        prefs(c).edit().putLong("last", System.currentTimeMillis()).apply()
        arm(c)
    }

    /** Sets one alarm for the next reminder after "last". */
    private fun arm(c: Context) {
        val am = c.getSystemService(AlarmManager::class.java)
        val pi = PendingIntent.getBroadcast(c, 1, Intent(c, ReminderReceiver::class.java).setAction(ACTION_FIRE), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        am.cancel(pi)
        val last = prefs(c).getLong("last", 0)
        val next = items(c).map { it.getLong("at") }.filter { it > last }.minOrNull() ?: return
        val exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()
        if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi) else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi)
    }

    /** Alarm went off (or the phone restarted): post everything due since the last run that's still open. */
    fun fire(c: Context, boot: Boolean = false) {
        val now = System.currentTimeMillis()
        val last = prefs(c).getLong("last", 0)
        val p = posted(c)
        items(c).filter { it.getLong("at") <= now && (it.getLong("at") > last || (boot && it.getString("key") in p)) && it.optLong("until", Long.MAX_VALUE) >= now }
            .forEach { post(c, it, quiet = boot) }
        prefs(c).edit().putLong("last", now).apply()
        arm(c)
    }

    fun repost(c: Context, key: String) {
        val it = items(c).firstOrNull { x -> x.getString("key") == key } ?: return
        if (it.optLong("until", Long.MAX_VALUE) < System.currentTimeMillis()) return
        post(c, it, quiet = true)
    }

    fun canPost(c: Context) = Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    private fun post(c: Context, item: JSONObject, quiet: Boolean) {
        if (!canPost(c)) return
        val nm = c.getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(NotificationChannel(CHANNEL, "Shot reminders", NotificationManager.IMPORTANCE_HIGH).apply { description = "Peptide doses that are due" })
        }
        val key = item.getString("key")
        val open = PendingIntent.getActivity(c, nid(key), Intent(c, MainActivity::class.java).putExtra(EXTRA_OPEN, "peptides").addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val back = PendingIntent.getBroadcast(c, nid(key), Intent(c, ReminderReceiver::class.java).setAction(ACTION_REPOST).putExtra("key", key), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_shot)
            .setContentTitle(item.optString("title", "Dose due"))
            .setContentText(item.optString("text", "Tap to log it"))
            .setStyle(NotificationCompat.BigTextStyle().bigText(item.optString("text", "Tap to log it")))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setContentIntent(open)
            .setDeleteIntent(back)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setSilent(quiet)
            .build()
        runCatching { nm.notify(nid(key), n) }
        setPosted(c, posted(c) + key)
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        when (i.action) {
            Reminders.ACTION_FIRE -> Reminders.fire(c)
            Reminders.ACTION_REPOST -> i.getStringExtra("key")?.let { Reminders.repost(c, it) }
            Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED -> Reminders.fire(c, boot = true)
        }
    }
}
