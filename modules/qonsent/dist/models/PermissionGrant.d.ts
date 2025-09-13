import { Document } from 'mongoose';
import { PermissionGrant } from '../types';
export interface IPermissionGrantDocument extends Omit<PermissionGrant, '_id'>, Document {
}
export declare const PermissionGrantModel: import("mongoose").Model<IPermissionGrantDocument, {}, {}, {}, Document<unknown, {}, IPermissionGrantDocument, {}, {}> & IPermissionGrantDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PermissionGrant.d.ts.map