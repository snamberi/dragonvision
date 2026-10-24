import struct, zlib, sys
src, dst = sys.argv[1], sys.argv[2]
d = open(src, 'rb').read()
sig, flavor, length, num, _, total, *_ = struct.unpack('>4sIIHHI', d[:20])
tables = []
for i in range(num):
    tag, off, clen, olen, csum = struct.unpack('>4sIIII', d[44 + i*20: 64 + i*20])
    raw = d[off:off+clen]
    data = zlib.decompress(raw) if clen < olen else raw
    tables.append((tag, csum, data))
tables.sort(key=lambda t: t[0])
es = 1; sr = 2
while sr*2 <= num: sr *= 2; es += 1
sr *= 16
out = bytearray(struct.pack('>IHHHH', flavor, num, sr, es - 1 if False else (sr//16).bit_length()-1, num*16 - sr))
off = 12 + 16*num
body = bytearray()
for tag, csum, data in tables:
    out += struct.pack('>4sIII', tag, csum, off + len(body), len(data))
    body += data + b'\0' * ((4 - len(data) % 4) % 4)
open(dst, 'wb').write(bytes(out + body))
