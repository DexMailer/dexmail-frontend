import mongoose, { Schema, Document } from 'mongoose';

export interface ICidMapping extends Document {
    cidHash: string;      // bytes32 hex from blockchain (e.g., 0x516d52...)
    fullCid: string;      // complete IPFS CID (e.g., QmWKAdu2GoJJVPLnaTYF9AvEkDou1abT...)
    createdAt: Date;
}

const CidMappingSchema: Schema = new Schema({
    cidHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    fullCid: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 90, // Auto-delete after 90 days
    },
});

export default mongoose.models.CidMapping || mongoose.model<ICidMapping>('CidMapping', CidMappingSchema);
