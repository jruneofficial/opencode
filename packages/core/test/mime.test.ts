import { describe, expect, test } from "bun:test"
import { Mime } from "@opencode/core/mime"

const bytes = (hex: string) => Uint8Array.from(Buffer.from(hex, "hex"))

describe("Mime.detect", () => {
  test("tells ISO-BMFF brands apart", () => {
    expect(Mime.detect(bytes("000000206674797061766966000000004d695072617669666d6961666d696631"))).toBe("image/avif")
    expect(Mime.detect(bytes("000000186674797061766973000000006d73663161766973"))).toBe("image/avif")
    expect(Mime.detect(bytes("00000018667479706d69663100000000617669666d69663100000000"))).toBe("image/avif")
    expect(Mime.detect(bytes("000000246674797068656963000000006d6966314d6950726d6961664d694842"))).toBe("image/heic")
    expect(Mime.detect(bytes("00000018667479706d69663100000000686569636d69663100000000"))).toBe("image/heic")
    expect(Mime.detect(bytes("000000206674797069736f6d0000020069736f6d69736f32617663316d703431"))).toBe("video/mp4")
    expect(Mime.detect(bytes("00000014667479707174202000000200717420200000000877696465"))).toBe("video/quicktime")
    expect(Mime.detect(bytes("0000001c667479704d344120000002004d34412069736f6d69736f3200000008"))).toBe("audio/mp4")
    expect(Mime.detect(bytes("000000186674797033677035000000003367703500000000"))).toBe("video/3gpp")
  })

  test("detects video and audio containers", () => {
    const raw = (value: string) => Uint8Array.from(Buffer.from(value, "binary"))
    expect(Mime.detect(bytes("524946460000000057415645"))).toBe("audio/wav")
    expect(Mime.detect(bytes("524946460000000041564920"))).toBe("video/x-msvideo")
    expect(Mime.detect(raw("ID3\x03\x00\x00\x00"))).toBe("audio/mpeg")
    expect(Mime.detect(bytes("fffb9044"))).toBe("audio/mpeg")
    expect(Mime.detect(bytes("fff15080"))).toBe("audio/aac")
    expect(Mime.detect(raw("fLaC\x00\x00\x00\x22"))).toBe("audio/flac")
    expect(Mime.detect(raw("OggS\x00\x02"))).toBe("audio/ogg")
    expect(Mime.detect(raw("OggS\x00\x02theora"))).toBe("video/ogg")
    expect(Mime.detect(bytes("1a45dfa3010000007765626d"))).toBe("video/webm")
    expect(Mime.detect(bytes("1a45dfa3010000006d6174726f736b61"))).toBe("video/x-matroska")
    expect(Mime.detect(raw("FORM\x00\x00\x00\x00AIFF"))).toBe("audio/aiff")
    expect(Mime.detect(raw("MThd\x00\x00\x00\x06"))).toBe("audio/midi")
    expect(Mime.detect(raw("FLV\x01"))).toBe("video/x-flv")
    expect(Mime.detect(bytes("000001ba44000000"))).toBe("video/mpeg")
  })
})
