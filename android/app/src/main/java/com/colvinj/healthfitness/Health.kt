package com.colvinj.healthfitness

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.Energy
import org.json.JSONArray
import org.json.JSONObject
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import kotlin.reflect.KClass

/** Health Connect: reads the scale and watch, writes workouts. */
class Health(private val context: Context) {
    private val provider = "com.google.android.apps.healthdata"

    private fun available() = HealthConnectClient.getSdkStatus(context, provider) == HealthConnectClient.SDK_AVAILABLE
    private val client by lazy { HealthConnectClient.getOrCreate(context) }

    suspend fun status(): JSONObject {
        val sdk = HealthConnectClient.getSdkStatus(context, provider)
        val out = JSONObject().put("available", sdk == HealthConnectClient.SDK_AVAILABLE)
            .put("needsUpdate", sdk == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
        if (sdk == HealthConnectClient.SDK_AVAILABLE) out.put("granted", toJson(client.permissionController.getGrantedPermissions()))
        return out
    }

    fun settingsIntent(): Intent =
        if (available()) Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
        else Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$provider"))

    private suspend fun <T : Record> all(type: KClass<T>, from: Instant, to: Instant = Instant.now()): List<T> {
        val out = mutableListOf<T>()
        var token: String? = null
        do {
            val res = client.readRecords(ReadRecordsRequest(type, TimeRangeFilter.between(from, to), pageSize = 1000, pageToken = token))
            out += res.records
            token = res.pageToken
        } while (!token.isNullOrEmpty())
        return out
    }

    private suspend fun granted(): Set<String> = client.permissionController.getGrantedPermissions()
    private fun day(t: Instant) = t.atZone(ZoneId.systemDefault()).toLocalDate().toString()

    /** Weigh-ins (last one each day, in lb), resting heart rate per day, and sleep hours per night. */
    suspend fun read(days: Int): JSONObject {
        if (!available()) return JSONObject().put("error", "Health Connect isn't available")
        val g = granted()
        val from = Instant.now().minus(Duration.ofDays(days.toLong()))
        val out = JSONObject()
        if (READ_WEIGHT in g) {
            val byDay = sortedMapOf<String, Double>()
            all(WeightRecord::class, from).sortedBy { it.time }.forEach { byDay[day(it.time)] = it.weight.inPounds }
            out.put("weights", JSONArray().apply { byDay.forEach { (d, lb) -> put(JSONObject().put("date", d).put("lb", Math.round(lb * 10) / 10.0)) } })
        }
        if (READ_RHR in g) {
            val byDay = sortedMapOf<String, Long>()
            all(RestingHeartRateRecord::class, Instant.now().minus(Duration.ofDays(30))).sortedBy { it.time }.forEach { byDay[day(it.time)] = it.beatsPerMinute }
            out.put("rhr", JSONArray().apply { byDay.forEach { (d, b) -> put(JSONObject().put("date", d).put("bpm", b)) } })
        }
        if (READ_SLEEP in g) {
            val byNight = sortedMapOf<String, Double>()
            all(SleepSessionRecord::class, Instant.now().minus(Duration.ofDays(14))).forEach {
                val d = day(it.endTime)
                byNight[d] = (byNight[d] ?: 0.0) + Duration.between(it.startTime, it.endTime).toMinutes() / 60.0
            }
            out.put("sleep", JSONArray().apply { byNight.forEach { (d, h) -> put(JSONObject().put("date", d).put("hours", Math.round(h * 10) / 10.0)) } })
        }
        return out.put("granted", toJson(g))
    }

    /** Average and max heart rate between two times (for a workout). */
    suspend fun heartRate(start: String, end: String): JSONObject {
        if (!available() || READ_HR !in granted()) return JSONObject()
        val samples = all(HeartRateRecord::class, Instant.parse(start), Instant.parse(end)).flatMap { r -> r.samples }
            .filter { it.time >= Instant.parse(start) && it.time <= Instant.parse(end) }
        if (samples.isEmpty()) return JSONObject()
        return JSONObject().put("avg", samples.map { it.beatsPerMinute }.average().toInt()).put("max", samples.maxOf { it.beatsPerMinute })
    }

    /**
     * Writes the workout. If another app (the watch) already logged a session that overlaps,
     * it is left alone and this one is skipped, unless force is set.
     */
    suspend fun writeSession(a: JSONObject): JSONObject {
        if (!available()) return JSONObject().put("error", "Health Connect isn't available")
        val g = granted()
        if (WRITE_EXERCISE !in g) return JSONObject().put("error", "No permission to write workouts")
        val start = Instant.parse(a.getString("start"))
        val end = Instant.parse(a.getString("end"))
        val zone: ZoneOffset = ZoneId.systemDefault().rules.getOffset(start)
        if (!a.optBoolean("force") && READ_EXERCISE in g) {
            val other = all(ExerciseSessionRecord::class, start.minus(Duration.ofMinutes(15)), end.plus(Duration.ofMinutes(15)))
                .firstOrNull { it.metadata.dataOrigin.packageName != context.packageName }
            if (other != null) return JSONObject().put("overlap", other.metadata.dataOrigin.packageName).put("title", other.title ?: "")
        }
        val records = mutableListOf<Record>(
            ExerciseSessionRecord(
                startTime = start, startZoneOffset = zone, endTime = end, endZoneOffset = zone,
                exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
                title = a.optString("title", "Workout"), notes = a.optString("notes", "").ifBlank { null },
            )
        )
        val kcal = a.optDouble("kcal", 0.0)
        if (kcal > 0 && WRITE_CALORIES in g) {
            records += ActiveCaloriesBurnedRecord(startTime = start, startZoneOffset = zone, endTime = end, endZoneOffset = zone, energy = Energy.kilocalories(kcal))
        }
        client.insertRecords(records)
        return JSONObject().put("ok", true)
    }

    companion object {
        val READ_WEIGHT = HealthPermission.getReadPermission(WeightRecord::class)
        val READ_HR = HealthPermission.getReadPermission(HeartRateRecord::class)
        val READ_RHR = HealthPermission.getReadPermission(RestingHeartRateRecord::class)
        val READ_SLEEP = HealthPermission.getReadPermission(SleepSessionRecord::class)
        val READ_EXERCISE = HealthPermission.getReadPermission(ExerciseSessionRecord::class)
        val WRITE_EXERCISE = HealthPermission.getWritePermission(ExerciseSessionRecord::class)
        val WRITE_CALORIES = HealthPermission.getWritePermission(ActiveCaloriesBurnedRecord::class)
        val ALL = setOf(READ_WEIGHT, READ_HR, READ_RHR, READ_SLEEP, READ_EXERCISE, WRITE_EXERCISE, WRITE_CALORIES)

        fun permissionContract() = PermissionController.createRequestPermissionResultContract()

        /** Short names the web side uses: weight, hr, rhr, sleep, exerciseRead, exercise, calories. */
        fun toJson(granted: Set<String>): JSONArray = JSONArray().apply {
            mapOf(READ_WEIGHT to "weight", READ_HR to "hr", READ_RHR to "rhr", READ_SLEEP to "sleep", READ_EXERCISE to "exerciseRead", WRITE_EXERCISE to "exercise", WRITE_CALORIES to "calories")
                .forEach { (p, n) -> if (p in granted) put(n) }
        }
    }
}
