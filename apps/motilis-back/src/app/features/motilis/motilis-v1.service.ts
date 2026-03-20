import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Motilis, MotilisDocument } from './motilis.schema';
import { convertDate } from './motilis.fn';

@Injectable()
export class MotilisService1 {
  constructor(
    @InjectModel(Motilis.name) private motilisModel: Model<MotilisDocument>,
  ) { }

  /**
   * 
   * @returns 
   */
  async getWordOfTheDay(): Promise<MotilisDocument> {
    return this.motilisModel.findOne({ isDisplay: true }).exec();
  }

  async changeWordDay(): Promise<MotilisDocument> {
    await this.motilisModel.updateOne(
      { isDisplay: true },
      { isDisplay: false, displayed: true },
    );

    const getOneRandomNotDisplayed = await this.motilisModel
      .aggregate<MotilisDocument>([
        { $match: { displayed: false, isDisplay: false } },
        { $sample: { size: 1 } },
      ])
      .exec();

    if (getOneRandomNotDisplayed.length === 0) {
      await this.resetWordOfTheDay(); // < Make sure this function throws if collection is empty (no quotes), otherwise this will be a stackoverflow (infinite loop)
      return this.changeWordDay();
    } else {
      const toDisplay = getOneRandomNotDisplayed[0];
      const displayed_at = toDisplay.displayed_at;
      displayed_at.push(convertDate());
      await this.motilisModel.updateOne(
        { _id: toDisplay._id },
        { displayed: true, isDisplay: true, displayed_at },
      );
      return toDisplay[0];
    }
  }

  async resetWordOfTheDay(): Promise<void> {
    const quotesUpdated = await this.motilisModel.updateMany(
      {},
      { displayed: false, isDisplay: false },
    );
    if (quotesUpdated.modifiedCount === 0) {
      throw new Error('No quotes found');
    }
  }
}
