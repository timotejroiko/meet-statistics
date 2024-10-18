
/**
 * @param {ArrayBuffer} input 
 */
async function decompress(input) {
	const ds = new DecompressionStream("gzip");
	const writer = ds.writable.getWriter();
	writer.write(input);
	writer.close();
	const reader = ds.readable.getReader();
	const output = [];
	let size = 0;
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		output.push(value);
		size += value.byteLength;
	}
	const data = new Uint8Array(size);
	let offset = 0;
	for (const array of output) {
		data.set(array, offset);
		offset += array.byteLength;
	}
	return data;
}

function unpack(data) {
	const obj = {};
	const result = decodeProto(data);
	if(!result.parts.length || result.leftOver.length) {
		obj["str"] = new TextDecoder().decode(data);
		return obj;
	}
	for(const part of result.parts) {
		let val = part.value;
		if(val instanceof Uint8Array) {
			val = unpack(val);
		}
		if(part.index in obj) {
			const existing = obj[part.index];
			if(Array.isArray(existing)) {
				existing.push(val);
			} else {
				obj[part.index] = [existing, val];
			}
		} else {
			obj[part.index] = val;
		}
	}
	return obj;
}

// function unpack(data) {
// 	const obj = {};
// 	const result = decodeProto(data);
// 	for(const part of result.parts) {
// 		if(part.type === 2) {
// 			const sub = decodeProto(part.value);
// 			if (part.value.length > 0 && sub.leftOver.length === 0) {
// 				obj[part.index] = unpack(part.value);
// 			} else if(!part.value.length) {
// 				obj[part.index] = "";
// 			} else {
// 				const td = new TextDecoder("utf-8", { fatal: true });
// 				try {
// 					obj[part.index] = td.decode(part.value);
// 				} catch {
// 					obj[part.index] = [...part.value].map(x => x.toString(16).padStart(2, "0")).join(" ");
// 				}
// 			}
// 		} else {
// 			obj[part.index] = part.value;
// 		}
// 	}
// 	return obj;
// }

/**
 * protobuf-decoder
 * https://github.com/pawitp/protobuf-decoder
 * https://protobuf-decoder.netlify.com/
 * Pawit Pornkitprasan
 * MIT
 */
class BufferReader{constructor(e){this.buffer=e,this.offset=0}readVarInt(){const e=decodeVarint(this.buffer,this.offset);return this.offset+=e.length,e.value}readBuffer(e){this.checkByte(e);const t=this.buffer.slice(this.offset,this.offset+e);return this.offset+=e,t}trySkipGrpcHeader(){const e=this.offset;if(0===this.buffer[this.offset]&&this.leftBytes()>=5){this.offset++;const t=this.buffer.readInt32BE(this.offset);this.offset+=4,t>this.leftBytes()&&(this.offset=e)}}leftBytes(){return this.buffer.length-this.offset}checkByte(e){const t=this.leftBytes();if(e>t)throw new Error("Not enough bytes left. Requested: "+e+" left: "+t)}checkpoint(){this.savedOffset=this.offset}resetToCheckpoint(){this.offset=this.savedOffset}}const e={VARINT:0,FIXED64:1,LENDELIM:2,FIXED32:5};function decodeProto(t){const f=new BufferReader(t),r=[];f.trySkipGrpcHeader();try{for(;f.leftBytes()>0;){f.checkpoint();const t=[f.offset],s=parseInt(f.readVarInt().toString()),n=7&s,i=s>>3;let o;if(n===e.VARINT)o=f.readVarInt().toString();else if(n===e.LENDELIM){const e=parseInt(f.readVarInt().toString());o=f.readBuffer(e)}else if(n===e.FIXED32)o=f.readBuffer(4);else{if(n!==e.FIXED64)throw new Error("Unknown type: "+n);o=f.readBuffer(8)}t.push(f.offset),r.push({byteRange:t,index:i,type:n,value:o})}}catch(e){f.resetToCheckpoint()}return{parts:r,leftOver:f.readBuffer(f.leftBytes())}}function typeToString(t,f){switch(t){case e.VARINT:return"varint";case e.LENDELIM:return f||"len_delim";case e.FIXED32:return"fixed32";case e.FIXED64:return"fixed64";default:return"unknown"}}function decodeVarint(e,t){let f=BigInt(0),r=0,s=0;do{if(t>=e.length)throw new RangeError("Index out of bound decoding varint");s=e[t++];const n=BigInt(2)**BigInt(r);r+=7,f+=BigInt(127&s)*n}while(s>=128);return{value:f,length:r/7}}
