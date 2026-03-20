import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MotilisStatus, MotilisStatusType } from './motilis.const';

export type MotilisDocument = Motilis & Document<string>;

@Schema()
export class Motilis {
  @Prop(String) public solution: string;
  @Prop(String) public link: string;
  @Prop({ type: Array<string>(), default: [] }) public displayed_at: string[];
  @Prop({ type: String, default: MotilisStatus.available }) public status: MotilisStatusType;
}

const MotilisSchema = SchemaFactory.createForClass(Motilis);
export { MotilisSchema };