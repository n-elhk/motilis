import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Motilis, MotilisDocument } from './motilis.schema';
import { convertDate } from './motilis.fn';


/**
 * Ne fonctionne pas car getRandomMotilisWithMinDisplayAt 
 * affichera celui qui a le moins d'element dans displayed_at or si on ajoute un nouveau
 * mot ça porsera probleme.
 */
@Injectable()
export class MotilisService2 {
  constructor(
    @InjectModel(Motilis.name) private motilisModel: Model<MotilisDocument>,
  ) { }

  private async getRandomMotilisWithMinDisplayAt(): Promise<MotilisDocument & { displayedAtCount: number } | null> {
    const minCountResult = await this.motilisModel.aggregate<MotilisDocument & { minCount: number }>([
      {
        $addFields: { displayedAtCount: { $size: '$displayed_at' } }
      },
      {
        $group: {
          _id: null,
          minCount: { $min: '$displayedAtCount' } // Trouve la plus petite taille
        }
      }
    ]).exec();

    if (!minCountResult.length) {
      // Si aucun résultat, retourne une erreur
      throw new Error('No result for min count');
    };

    const minCount = minCountResult[0].minCount;

    const result = await this.motilisModel
      .aggregate<MotilisDocument & { displayedAtCount: number }>([
        {
          $addFields: { displayedAtCount: { $size: '$displayed_at' } }
        },
        {
          $match: { displayedAtCount: minCount } // Filtre sur la taille minimale
        },
        { $sample: { size: 1 } } // Sélectionne un au hasard
      ])
      .exec()

    if (!result.length) {
      // Si aucun résultat, retourne une erreur
      throw new Error('No result for displayed count');
    };

    return result[0];
  }

  async getAndUpdateRandomMotilis(): Promise<MotilisDocument> {
    const motilis = await this.getRandomMotilisWithMinDisplayAt(); // Récupère un mot au hasard avec le moins d'items

    return this.motilisModel.findByIdAndUpdate(
      motilis._id, // Identifiant du document
      { $push: { displayed_at: convertDate() } }, // Ajoute un nouvel élément au tableau
      { new: true } // Retourne le document mis à jour
    ).exec();
  }

  async findByDate(date: string): Promise<Motilis | null> {
    return this.motilisModel.findOne({ displayed_at: { $in: [date] } }).exec();
  }
}
