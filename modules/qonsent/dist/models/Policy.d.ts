import { Document } from 'mongoose';
import { Policy } from '../types';
export interface IPolicyDocument extends Omit<Policy, '_id'>, Document {
}
export declare const PolicyModel: import("mongoose").Model<IPolicyDocument, {}, {}, {}, Document<unknown, {}, IPolicyDocument, {}, {}> & IPolicyDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Policy.d.ts.map