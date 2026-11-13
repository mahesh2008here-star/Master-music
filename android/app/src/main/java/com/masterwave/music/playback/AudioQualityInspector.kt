package com.masterwave.music.playback

import androidx.media3.common.Format

data class AudioQualityReport(
    val codec: String,
    val container: String,
    val sampleRate: Int,
    val bitDepth: Int?,
    val channelCount: Int,
    val bitrateKbps: Int,
    val isLossless: Boolean,
    val isHiRes: Boolean,
    val isResampledByAndroidMixer: Boolean,
    val outputDeviceName: String,
    val badgeLabel: String
)

class AudioQualityInspector {

    fun inspectFormat(format: Format?, activeOutputDevice: String = "Built-in Speaker"): AudioQualityReport {
        if (format == null) {
            return AudioQualityReport(
                codec = "Unknown",
                container = "Stream",
                sampleRate = 44100,
                bitDepth = null,
                channelCount = 2,
                bitrateKbps = 128,
                isLossless = false,
                isHiRes = false,
                isResampledByAndroidMixer = true,
                outputDeviceName = activeOutputDevice,
                badgeLabel = "Standard"
            )
        }

        val sampleMimeType = format.sampleMimeType ?: ""
        val isFlac = sampleMimeType.contains("flac", ignoreCase = true)
        val isOpus = sampleMimeType.contains("opus", ignoreCase = true)
        val isAac = sampleMimeType.contains("mp4a", ignoreCase = true) || sampleMimeType.contains("aac", ignoreCase = true)

        val sampleRate = format.sampleRate
        val bitDepth = if (isFlac) 16 else null // Or 24 if PCM_24BIT
        val bitrate = if (format.bitrate != Format.NO_VALUE) format.bitrate / 1000 else if (isOpus) 139 else 256

        val isLossless = isFlac || sampleMimeType.contains("wav", ignoreCase = true)
        val isHiRes = isLossless && (sampleRate >= 88200 || (bitDepth != null && bitDepth >= 24))

        // Android AudioFlinger normally resamples non-48kHz audio to 48kHz unless Direct PCM / USB DAC is used
        val isResampled = activeOutputDevice != "USB DAC (Bit-Perfect)" && sampleRate != 48000

        val badgeLabel = when {
            isHiRes -> "Hi-Res Lossless"
            isLossless -> "Lossless"
            isOpus -> "Opus • $bitrate kbps"
            isAac -> "AAC • $bitrate kbps"
            else -> "High Quality"
        }

        return AudioQualityReport(
            codec = if (isFlac) "FLAC" else if (isOpus) "Opus" else if (isAac) "AAC" else "PCM",
            container = if (isOpus) "WebM" else if (isFlac) "FLAC" else "M4A",
            sampleRate = sampleRate,
            bitDepth = bitDepth,
            channelCount = format.channelCount,
            bitrateKbps = bitrate,
            isLossless = isLossless,
            isHiRes = isHiRes,
            isResampledByAndroidMixer = isResampled,
            outputDeviceName = activeOutputDevice,
            badgeLabel = badgeLabel
        )
    }
}
