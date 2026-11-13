package com.masterwave.music.provider

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.StreamingService
import org.schabi.newpipe.extractor.localization.Localization
import org.schabi.newpipe.extractor.search.SearchInfo
import org.schabi.newpipe.extractor.stream.AudioStream
import org.schabi.newpipe.extractor.stream.StreamInfo
import org.schabi.newpipe.extractor.stream.StreamInfoItem

/**
 * Real NewPipeExtractor MusicProvider implementation for Android.
 * Supports YouTube (Music / Video) and SoundCloud via TeamNewPipe ServiceList.
 *
 * Integrity rule: NewPipe streams from YouTube/SoundCloud are lossy (Opus / M4A AAC)
 * and are never falsely labeled as FLAC or lossless.
 */
class NewPipeMusicProvider(
    private val service: StreamingService = ServiceList.YouTube
) : MusicProvider {

    override val providerId: String = "newpipe_${service.serviceInfo.name.lowercase()}"
    override val displayName: String = "NewPipe (${service.serviceInfo.name})"
    override val isLosslessSupported: Boolean = false

    init {
        ensureInitialized()
    }

    override suspend fun searchTracks(query: String): Result<List<Track>> = withContext(Dispatchers.IO) {
        runCatching {
            ensureInitialized()
            val contentFilter = if (service == ServiceList.YouTube) {
                listOf("music_songs")
            } else {
                emptyList()
            }
            val extractor = service.getSearchExtractor(query, contentFilter, "")
            val searchInfo = SearchInfo.getInfo(extractor)

            searchInfo.relatedItems
                .filterIsInstance<StreamInfoItem>()
                .map { item ->
                    Track(
                        id = item.url,
                        title = item.name ?: "Unknown Title",
                        artist = item.uploaderName ?: "Unknown Artist",
                        album = "NewPipe Stream",
                        durationSeconds = item.duration.coerceAtLeast(0L),
                        artworkUrl = item.thumbnails.maxByOrNull { it.width }?.url ?: "",
                        providerId = providerId,
                        isLosslessAvailable = false
                    )
                }
        }
    }

    override suspend fun getTrackDetails(trackId: String): Result<Track> = withContext(Dispatchers.IO) {
        runCatching {
            ensureInitialized()
            val url = normalizeTrackUrl(trackId)
            val streamInfo = StreamInfo.getInfo(service, url)
            Track(
                id = streamInfo.url,
                title = streamInfo.name ?: "Unknown Title",
                artist = streamInfo.uploaderName ?: "Unknown Artist",
                album = streamInfo.category ?: "NewPipe Stream",
                durationSeconds = streamInfo.duration.coerceAtLeast(0L),
                artworkUrl = streamInfo.thumbnails.maxByOrNull { it.width }?.url ?: "",
                providerId = providerId,
                isLosslessAvailable = false
            )
        }
    }

    override suspend fun resolveStream(
        track: Track,
        preferredQuality: QualityTier
    ): Result<StreamResolution> = withContext(Dispatchers.IO) {
        runCatching {
            ensureInitialized()
            val url = normalizeTrackUrl(track.id)
            val streamInfo = StreamInfo.getInfo(service, url)
            val audioStreams = streamInfo.audioStreams
                .filter { !it.isVideoOnly && !it.content.isNullOrBlank() }

            if (audioStreams.isEmpty()) {
                throw IllegalStateException("No playable audio streams returned by NewPipeExtractor for $url")
            }

            val selected = selectAudioStream(audioStreams, preferredQuality)
            val formatName = selected.format?.name ?: "WEBMA_OPUS"
            val isOpus = formatName.contains("OPUS", ignoreCase = true) ||
                (selected.codec?.contains("opus", ignoreCase = true) == true)

            StreamResolution(
                streamUrl = selected.content,
                mimeType = selected.format?.mimeType ?: if (isOpus) "audio/webm" else "audio/mp4",
                codec = if (isOpus) "Opus" else "AAC-LC",
                container = if (isOpus) "WebM" else "MP4 / M4A",
                sampleRate = if (isOpus) 48000 else 44100,
                bitDepth = null,
                nominalBitrateKbps = selected.averageBitrate.takeIf { it > 0 } ?: 128,
                isVerifiedLossless = false,
                providerSource = "NewPipeExtractor (${service.serviceInfo.name})"
            )
        }
    }

    private fun selectAudioStream(
        streams: List<AudioStream>,
        preferredQuality: QualityTier
    ): AudioStream {
        val sortedDesc = streams.sortedWith(
            compareByDescending<AudioStream> {
                val isOpus = it.format?.name?.contains("OPUS", ignoreCase = true) == true
                if (isOpus) 1 else 0
            }.thenByDescending { it.averageBitrate }
        )

        return when (preferredQuality) {
            QualityTier.STANDARD_LOSSY ->
                sortedDesc.lastOrNull { it.averageBitrate in 64..128 } ?: sortedDesc.last()
            else -> sortedDesc.first()
        }
    }

    private fun normalizeTrackUrl(trackId: String): String {
        if (trackId.startsWith("http://") || trackId.startsWith("https://")) {
            return trackId
        }
        return "https://www.youtube.com/watch?v=$trackId"
    }

    companion object {
        @Volatile
        private var initialized = false

        fun ensureInitialized() {
            if (!initialized) {
                synchronized(this) {
                    if (!initialized) {
                        NewPipe.init(NewPipeDownloader.getInstance(), Localization("US", "en"))
                        initialized = true
                    }
                }
            }
        }
    }
}
