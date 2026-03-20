import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Motilis, MotilisDocument } from './motilis.schema';
import { convertDate, getPastDate, increaseDate } from './motilis.fn';
import { CHRISTIAN_WORDS, MotilisStatus } from './motilis.const';

@Injectable()
export class MotilisService {
  constructor(
    @InjectModel(Motilis.name) private motilisModel: Model<MotilisDocument>,
  ) { }


  /**
 * 
 * 
 * @returns 
 */
  async createMotilis(): Promise<boolean> {

    let date = getPastDate(CHRISTIAN_WORDS.length);
    let i = 0;

    for await (const word of CHRISTIAN_WORDS) {
      date = increaseDate(date);

      this.motilisModel.create({
        displayed_at: [convertDate(date)],
        link: '',
        status: i === CHRISTIAN_WORDS.length - 1 ? MotilisStatus.inprogress : MotilisStatus.available,
        solution: word
      });

      i = ++i
    }
    return true
  }

  /**
   * 
   * @returns 
   */
  async getWordOfTheDay(): Promise<MotilisDocument> {
    return this.motilisModel.findOne({ status: MotilisStatus.inprogress }).exec();
  }

  async findByDate(date: string): Promise<Motilis | null> {
    return this.motilisModel.findOne({ displayed_at: { $in: [date] } }).exec();
  }

  async getAndUpdateRandomMotilis(): Promise<MotilisDocument> {
    await this.motilisModel.updateOne(
      { status: MotilisStatus.inprogress },
      { status: MotilisStatus.displayed },
    );

    const getOneRandomNotDisplayed = await this.motilisModel
      .aggregate<MotilisDocument>([
        { $match: { status: MotilisStatus.available } },
        { $sample: { size: 1 } },
      ])
      .exec();

    if (getOneRandomNotDisplayed.length === 0) {
      await this.resetWordOfTheDay(); // < Make sure this function throws if collection is empty (no quotes), otherwise this will be a stackoverflow (infinite loop)
      return this.getAndUpdateRandomMotilis();
    } else {
      const toDisplay = getOneRandomNotDisplayed[0];
      const displayed_at = toDisplay.displayed_at;
      displayed_at.push(convertDate());

      await this.motilisModel.updateOne(
        { _id: toDisplay._id },
        { status: MotilisStatus.inprogress, displayed_at },
      );

      return toDisplay;
    }
  }

  async resetWordOfTheDay(): Promise<void> {
    const quotesUpdated = await this.motilisModel.updateMany(
      {},
      { status: MotilisStatus.available },
    );
    if (quotesUpdated.modifiedCount === 0) {
      throw new Error('No quotes found');
    }
  }
}
