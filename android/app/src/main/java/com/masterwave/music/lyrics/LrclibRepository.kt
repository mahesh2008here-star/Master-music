package com.masterwave.music.lyrics

data class LyricLine(
    val timeMs: Long,
    val text: String
)

data class LyricsData(
    val id: Long?,
    val trackName: String,
    val artistName: String,
    val plainLyrics: String?,
    val syncedLyrics: String?,
    val lines: List<LyricLine>
)

class LrclibRepository {

    private val userAgent = "MasterWave-Android/5.2.0 (https://github.com/masterwave)"

    fun parseLrc(lrcText: String): List<LyricLine> {
        val lineRegex = Regex("""\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)""")
        val results = mutableListOf<LyricLine>()

        lrcText.lines().forEach { line ->
            val match = lineRegex.matchEntire(line.trim())
            if (match != null) {
                val min = match.groupValues[1].toLongOrNull() ?: 0L
                val sec = match.groupValues[2].toLongOrNull() ?: 0L
                val msStr = match.groupValues[3].padEnd(3, '0').take(3)
                val ms = msStr.toLongOrNull() ?: 0L
                val totalMs = (min * 60 + sec) * 1000 + ms
                val text = match.groupValues[4].trim()
                if (text.isNotEmpty()) {
                    results.add(LyricLine(timeMs = totalMs, text = text))
                }
            }
        }
        return results.sortedBy { it.timeMs }
    }
}
