class AudioRecorder extends AudioWorkletProcessor {
  static get parameterDescriptors() { // <1>
    return [
      {
        name: 'isRecording',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
      },
    ]
  }

  process(inputs, outputs, parameters) {
    const buffer = []
    const channel = 0

    for (let t = 0; t < inputs[0][channel].length; t += 1) {
      if (parameters.isRecording[0] === 1) { // <2>
        buffer.push(inputs[0][channel][t])
      }
    }

    if (buffer.length >= 1) {
      this.port.postMessage({ buffer }) // <3>
    }

    return true
  }
}

function encodeAudio(buffers, settings) {
  const sampleCount = buffers.reduce((memo, buffer) => {
    return memo + buffer.length
  }, 0)

  const bytesPerSample = settings.sampleSize / 8
  const bitsPerByte = 8
  const dataLength = sampleCount * bytesPerSample
  const sampleRate = settings.sampleRate

  const arrayBuffer = new ArrayBuffer(44 + dataLength)
  const dataView = new DataView(arrayBuffer)

  dataView.setUint8(0, 'R'.charCodeAt(0)) // <10>
  dataView.setUint8(1, 'I'.charCodeAt(0))
  dataView.setUint8(2, 'F'.charCodeAt(0))
  dataView.setUint8(3, 'F'.charCodeAt(0))
  dataView.setUint32(4, 36 + dataLength, true)
  dataView.setUint8(8, 'W'.charCodeAt(0))
  dataView.setUint8(9, 'A'.charCodeAt(0))
  dataView.setUint8(10, 'V'.charCodeAt(0))
  dataView.setUint8(11, 'E'.charCodeAt(0))
  dataView.setUint8(12, 'f'.charCodeAt(0))
  dataView.setUint8(13, 'm'.charCodeAt(0))
  dataView.setUint8(14, 't'.charCodeAt(0))
  dataView.setUint8(15, ' '.charCodeAt(0))
  dataView.setUint32(16, 16, true)
  dataView.setUint16(20, 1, true)
  dataView.setUint16(22, 1, true)
  dataView.setUint32(24, sampleRate, true)
  dataView.setUint32(28, sampleRate * 2, true)
  dataView.setUint16(32, bytesPerSample, true)
  dataView.setUint16(34, bitsPerByte * bytesPerSample, true)
  dataView.setUint8(36, 'd'.charCodeAt(0))
  dataView.setUint8(37, 'a'.charCodeAt(0))
  dataView.setUint8(38, 't'.charCodeAt(0))
  dataView.setUint8(39, 'a'.charCodeAt(0))
  dataView.setUint32(40, dataLength, true)

  let index = 44

  for (const buffer of buffers) {
    for (const value of buffer) {
      dataView.setInt16(index, value * 0x7fff, true)
      index += 2
    }
  }

  return new Blob([dataView], { type: 'audio/wav' })
}

registerProcessor('audio-recorder', AudioRecorder) // <4>

