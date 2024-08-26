/* eslint-disable */
/* tslint:disable */
import { createPositionAnalyzer } from '../../utils.js'
import MixerChannel from './mixerChannel.js'

const analyzePositions = createPositionAnalyzer('superpowered')

class MixerEngine {
  constructor(superpoweredInstance, samplerate) {
    this.Superpowered = superpoweredInstance

    this.stereoMixerA = new this.Superpowered.StereoMixer()
    this.stereoMixerB = new this.Superpowered.StereoMixer()
    this.stereoMixerC = new this.Superpowered.StereoMixer()
    this.stereoMixerD = new this.Superpowered.StereoMixer()
    this.stereoMixerE = new this.Superpowered.StereoMixer()

    this.reverbOutput = new this.Superpowered.Float32Buffer(4096)
    this.Superpowered.Spatializer.reverbWidth = 0.4 // Global Spatializer Reverb stereo width. >= 0 and <= 1.
    this.Superpowered.Spatializer.reverbDamp = 0.5 // Global Spatializer Reverb high frequency damping. >= 0 and <= 1.
    this.Superpowered.Spatializer.reverbRoomSize = 0.6 // Global Spatializer Reverb room size. >= 0 and <= 1.
    this.Superpowered.Spatializer.reverbPredelayMs = 0 // Global Spatializer Reverb pre-delay in milliseconds. 0 to 500.
    this.Superpowered.Spatializer.reverbLowCutHz = 100

    this.channels = []
    this.channelState = {}
    this.samplerate = samplerate
    this.isPlaying = false
    this.masterVolume = 1
  }

  getSoloChannels() {
    let soloChannels = []
    for (const [channelId, channelState] of Object.entries(this.channelState)) {
      if (channelState.isSolo) {
        soloChannels.push(channelId)
      }
    }

    return soloChannels
  }

  loadChannels(channels) {
    const existingChannelsToKill = this.channels.filter(
      (channel) => !channels.find((c) => c.url === channel.url)
    )
    const newChannelsToCreate = channels.filter(
      (channel) =>
        !this.channels.find(
          (existingChannel) => existingChannel.url === channel.url
        )
    )

    for (const channel of existingChannelsToKill) {
      this.solo(channel.id, false)
      channel.destroy()
      this.channels.splice(this.channels.indexOf(channel), 1)
    }

    for (const channel of newChannelsToCreate) {
      this.channels.push(
        new MixerChannel(this.Superpowered, this.samplerate, channel)
      )

      this.channelState[channel.id] = {
        pan: channel?.pan || 0,
        volume: channel?.volume ?? 1,
        isMuted: channel?.isMuted || false,
        isSolo: channel?.isSolo || false,
      }
      this.setVolume(channel.id, this.channelState[channel.id].volume)
      this.mute(channel.id, this.channelState[channel.id].isMuted)
      this.solo(channel.id, this.channelState[channel.id].isSolo)
      this.pan(channel.id, this.channelState[channel.id].pan)
    }
  }

  getStatus() {
    const status = {
      isPlaying: Boolean(this.isPlaying),
      isSpatialized: false,

      isLooping: false,
      loop: {
        fromMs: null,
        toMs: null,
      },

      isRepeating: false,

      durationsMs: 0,
      durationMs: 0,
      positionMs: 0,

      masterVolume: this.masterVolume,

      pitchShiftCents: 0,
      playbackRate: 1,

      channels: [],
      channelsInObj: {},
    }

    const channelsWithStatus = this.channels.map((channel) => [
      channel,
      channel.getStatus(),
    ])

    channelsWithStatus.forEach(([channel, channelStatus]) => {
      if (channelStatus.durationsMs > status.durationMs) {
        status.durationMs = channelStatus.durationMs
        status.durationsMs = channelStatus.durationMs
      }

      if (channelStatus.positionMs > status.positionMs) {
        status.positionMs = channelStatus.positionMs
      }

      if (channelStatus.spatialize) {
        status.isSpatialized = true
      }

      if (channelStatus.isLooping) {
        status.isLooping = true
      }

      if (channelStatus.loop) {
        status.loop = channelStatus.loop
      }

      if (channelStatus.isRepeating) {
        status.isRepeating = true
      }

      if (channelStatus.pitchShiftCents !== 0) {
        status.pitchShiftCents = channelStatus.pitchShiftCents
      }

      if (channelStatus.playbackRate !== 1) {
        status.playbackRate = channelStatus.playbackRate
      }

      const thisChannelStatus = {
        id: channelStatus.id,
        url: channelStatus.url,
        isPlaying: channelStatus.isPlaying,
        isLooping: channelStatus.isLooping,
        isRepeating: channelStatus.isRepeating,
        durationsMs: channelStatus.durationsMs,
        durationMs: channelStatus.durationMs,
        positionMs: channelStatus.positionMs,
        pitchShiftCents: channelStatus.pitchShiftCents,
        playbackRate: channelStatus.playbackRate,

        volume: this.channelState[channel.id].volume,
        realVolume: channelStatus.volume,

        pan: this.channelState[channel.id].pan,
        isMuted: this.channelState[channel.id].isMuted,
        isSolo: this.channelState[channel.id].isSolo,
        spatialize: channelStatus.spatialize,
        ready: channelStatus.ready,
      }

      status.channels.push(thisChannelStatus)
      status.channelsInObj[channelStatus.id] = thisChannelStatus
    })

    this.sync(status, channelsWithStatus)

    return status
  }

  sync(status, channelsWithStatus) {
    const positions = []
    const loopSync = { status: null, channels: [] }
    const tempoSync = { status: null, channels: [] }

    channelsWithStatus.forEach(([channel, channelStatus]) => {
      positions.push({
        id: channelStatus.id,
        positionMs: channelStatus.positionMs,
      })

      if (channelStatus.isLooping) {
        loopSync.status = loopSync.status || channelStatus
      } else {
        loopSync.channels.push(channel)
      }

      if (channelStatus.playbackRate !== 1) {
        tempoSync.status = tempoSync.status || channelStatus
      } else {
        tempoSync.channels.push(channel)
      }
    })

    analyzePositions(positions)

    // Sync loop state between channels
    if (loopSync.status && loopSync.channels.length > 0) {
      loopSync.channels.forEach((channel) => {
        channel.loop(loopSync.status.loop.fromMs, loopSync.status.loop.toMs)
      })
    }

    // Sync playback rate state between channels
    if (tempoSync.status && tempoSync.channels.length > 0) {
      tempoSync.channels.forEach((channel) => {
        channel.setPlaybackRate(tempoSync.status.playbackRate)
      })
    }

    // Stop if the position is past the end of the track
    const ended =
      status.durationMs > 1000 &&
      Math.ceil(status.positionMs) >= status.durationMs - 200

    if (ended && !status.isRepeating && !status.isLooping) {
      this.pause()
      this.seek(0)
    }
  }

  getChannel(channelId) {
    return this.channels.find((channel) => channel.id === channelId)
  }

  setVolume(channelId, value) {
    this.channelState[channelId].volume = value

    const soloChannels = this.getSoloChannels()

    if (
      (!this.channelState[channelId].isMuted && soloChannels.length === 0) ||
      soloChannels.includes(channelId)
    ) {
      this.getChannel(channelId).setVolume(value)
    }
  }

  spatialize(channelId, value) {
    if (channelId === 'all-mixer-channels') {
      for (const channel of this.channels) {
        this.getChannel(channel.id).spatialize(value)
      }
    } else {
      this.getChannel(channelId).spatialize(value)
    }
  }

  mute(channelId, value) {
    if (value === true) {
      this.channelState[channelId].isMuted = true
      this.getChannel(channelId).setVolume(0)
    } else {
      this.channelState[channelId].isMuted = false
      this.getChannel(channelId).setVolume(this.channelState[channelId].volume)
    }
  }

  solo(channelId, value) {
    if (value === true) {
      this.channelState[channelId].isSolo = true
    } else {
      this.channelState[channelId].isSolo = false
    }

    const soloChannels = this.getSoloChannels()

    for (const channel of this.channels) {
      if (soloChannels.includes(channel.id)) {
        this.getChannel(channel.id).setVolume(
          this.channelState[channel.id].isMuted
            ? 0
            : this.channelState[channel.id].volume
        )
      } else {
        this.getChannel(channel.id).setVolume(
          soloChannels.length > 0 || this.channelState[channel.id].isMuted
            ? 0
            : this.channelState[channel.id].volume
        )
      }
    }
  }

  pan(channelId, value) {
    const channelIndex = this.channels.findIndex(
      (channel) => channel.id === channelId
    )

    this.channelState[channelId].pan = parseFloat(value)

    let left = 1
    let right = 1

    if (value > 0) {
      left = 1 - value
    }

    if (value < 0) {
      right = 1 - value * -1
    }

    const gain = {
      left: parseFloat(left.toFixed(2)),
      right: parseFloat(right.toFixed(2)),
    }

    if (channelIndex === 0) {
      this.stereoMixerA.inputGain[0] = gain.left
      this.stereoMixerA.inputGain[1] = gain.right
    }

    if (channelIndex === 1) {
      this.stereoMixerA.inputGain[2] = gain.left
      this.stereoMixerA.inputGain[3] = gain.right
    }

    if (channelIndex === 2) {
      this.stereoMixerA.inputGain[4] = gain.left
      this.stereoMixerA.inputGain[5] = gain.right
    }

    if (channelIndex === 3) {
      this.stereoMixerA.inputGain[6] = gain.left
      this.stereoMixerA.inputGain[7] = gain.right
    }

    if (channelIndex === 4) {
      this.stereoMixerB.inputGain[2] = gain.left
      this.stereoMixerB.inputGain[3] = gain.right
    }

    if (channelIndex === 5) {
      this.stereoMixerB.inputGain[4] = gain.left
      this.stereoMixerB.inputGain[5] = gain.right
    }

    if (channelIndex === 6) {
      this.stereoMixerB.inputGain[6] = gain.left
      this.stereoMixerB.inputGain[7] = gain.right
    }

    if (channelIndex === 7) {
      this.stereoMixerC.inputGain[2] = gain.left
      this.stereoMixerC.inputGain[3] = gain.right
    }

    if (channelIndex === 8) {
      this.stereoMixerC.inputGain[4] = gain.left
      this.stereoMixerC.inputGain[5] = gain.right
    }

    if (channelIndex === 9) {
      this.stereoMixerC.inputGain[6] = gain.left
      this.stereoMixerC.inputGain[7] = gain.right
    }

    if (channelIndex === 10) {
      this.stereoMixerD.inputGain[2] = gain.left
      this.stereoMixerD.inputGain[3] = gain.right
    }

    if (channelIndex === 11) {
      this.stereoMixerD.inputGain[4] = gain.left
      this.stereoMixerD.inputGain[5] = gain.right
    }

    if (channelIndex === 12) {
      this.stereoMixerD.inputGain[6] = gain.left
      this.stereoMixerD.inputGain[7] = gain.right
    }

    if (channelIndex === 13) {
      this.stereoMixerE.inputGain[2] = gain.left
      this.stereoMixerE.inputGain[3] = gain.right
    }

    if (channelIndex === 14) {
      this.stereoMixerE.inputGain[4] = gain.left
      this.stereoMixerE.inputGain[5] = gain.right
    }

    if (channelIndex === 15) {
      this.stereoMixerE.inputGain[6] = gain.left
      this.stereoMixerE.inputGain[7] = gain.right
    }
  }

  play() {
    this.isPlaying = true
    for (const channel of this.channels) {
      channel.play()
    }
  }

  loop(fromMs, toMs, noSeek) {
    this.isLooping = true
    for (const channel of this.channels) {
      channel.loop(fromMs, toMs, noSeek)
    }
  }

  unLoop() {
    for (const channel of this.channels) {
      channel.unLoop()
    }
    this.isLooping = false
  }

  pause() {
    this.isPlaying = false
    for (const channel of this.channels) {
      channel.pause()
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  setPlaybackRate(rate) {
    for (const channel of this.channels) {
      channel.setPlaybackRate(rate)
    }
  }

  set(key, value, exclusiveToChannel) {
    if (key === 'gain' && exclusiveToChannel) {
      this.gain(exclusiveToChannel, value)
      return
    }

    if (key === 'volume' && !exclusiveToChannel) {
      this.masterVolume = value
      return
    }

    if (key === 'volume' && exclusiveToChannel) {
      this.setVolume(exclusiveToChannel, value)
      return
    }

    for (const channel of this.channels) {
      if (!exclusiveToChannel || channel.id === exclusiveToChannel) {
        channel.set(key, value)
      }
    }
  }

  seek(time) {
    const wasPlaying = this.isPlaying

    this.pause()

    for (const channel of this.channels) {
      channel.seek(time)
    }

    if (wasPlaying) {
      this.play()
    }
  }

  /**
   * Sync all channels to the farthest channel position. Useful to sync
   * channels loaded late while the mixer was playing.
   *
   * Runs only if all channels are loaded and the mixer is playing.
   */
  syncToFarthestPosition() {
    const ready = this.channels.every((channel) => channel.assetLoaded)

    if (!ready || !this.isPlaying) {
      return
    }

    this.pause()

    const farthestPosition = this.channels
      .map((channel) => channel.getStatus().positionMs)
      .reduce((a, b) => Math.max(a, b))

    if (farthestPosition > 0) {
      this.seek(farthestPosition)
    }

    this.play()
  }

  repeat(enabled) {
    for (const channel of this.channels) {
      channel.repeat(enabled)
    }
  }

  process(inputBuffer, outputBuffer, bufferSize) {
    for (let channel = 0; channel < this.channels.length; channel++) {
      this.channels[channel].process(bufferSize)
    }

    this.stereoMixerA.process(
      this.channels[0]?.channelOutputBuffer || 0,
      this.channels[1]?.channelOutputBuffer || 0,
      this.channels[2]?.channelOutputBuffer || 0,
      this.channels[3]?.channelOutputBuffer || 0,
      outputBuffer,
      bufferSize
    )

    this.stereoMixerB.process(
      outputBuffer,
      this.channels[4]?.channelOutputBuffer || 0,
      this.channels[5]?.channelOutputBuffer || 0,
      this.channels[6]?.channelOutputBuffer || 0,
      outputBuffer,
      bufferSize
    )

    this.stereoMixerC.process(
      outputBuffer,
      this.channels[7]?.channelOutputBuffer || 0,
      this.channels[8]?.channelOutputBuffer || 0,
      this.channels[9]?.channelOutputBuffer || 0,
      outputBuffer,
      bufferSize
    )

    this.stereoMixerD.process(
      outputBuffer,
      this.channels[10]?.channelOutputBuffer || 0,
      this.channels[11]?.channelOutputBuffer || 0,
      this.channels[12]?.channelOutputBuffer || 0,
      outputBuffer,
      bufferSize
    )

    this.stereoMixerE.process(
      outputBuffer,
      this.channels[13]?.channelOutputBuffer || 0,
      this.channels[14]?.channelOutputBuffer || 0,
      this.channels[15]?.channelOutputBuffer || 0,
      outputBuffer,
      bufferSize
    )

    // this.stereoMixerD.process(
    //     outputBuffer,
    //     this.channels[10]?.channelOutputBuffer || 0,
    //     this.channels[11]?.channelOutputBuffer || 0,
    //     this.channels[12]?.channelOutputBuffer || 0,
    //     outputBuffer,
    //     bufferSize
    // );

    // Generate player buffers (or silence)
    // if (!this.channels.length === 0) {
    // for (let n = 0; n < bufferSize; n++) outputBuffer.array[n] = 0;
    // }

    // Output the global spatializer reverb into a buffer, then mix it into the output.
    // if (this.Superpowered.Spatializer.reverbProcess(this.reverbOutput.pointer, bufferSize)) {
    //   this.Superpowered.Add1(this.reverbOutput.pointer, outputBuffer, bufferSize * 2);
    // }

    this.Superpowered.Volume(
      outputBuffer, // Pointer to floating point numbers. 32-bit interleaved stereo input.
      outputBuffer, // Pointer to floating point numbers. 32-bit interleaved stereo output. Can be equal to input (in-place processing).
      this.masterVolume, // Volume for the first frame.
      this.masterVolume, // Volume for the last frame. Volume will be smoothly calculated between the first and last frames.
      bufferSize // The number of frames to process.
    )
  }
}

export default MixerEngine
