import { Controller, Get, HttpStatus, Req, Res, Sse } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Cron, CronExpression } from '@nestjs/schedule';
import { map, Observable, Subject } from 'rxjs';
import { timeToMidnight } from './motilis.fn';
import { MotilisService } from './motilis.service';

@Controller()
export class MotilisController {

  private wordChange$ = new Subject<string>();

  constructor(private readonly motilisService: MotilisService) { }

  @Get('create-word')
  async createWordDay(@Res() res: FastifyReply): Promise<void> {
    try {
      const motilis = await this.motilisService.createMotilis();
      res.status(200).send(motilis);
    } catch (error) {
      console.log(error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async changeWordDay(): Promise<void> {
    try {
      const motilis = await this.motilisService.getAndUpdateRandomMotilis();
      this.wordChange$.next(motilis._id);

    } catch (error) {
      console.log(error);
    }
  }

  @Sse('word-changed')
  wordChanged(): Observable<{ data: string }> {
    return this.wordChange$.pipe(
      map((data) => ({ data }))
    )
  }

  @Get('update-word')
  async updateWord(@Res() res: FastifyReply) {
    try {
      const motilis = await this.motilisService.getAndUpdateRandomMotilis();
      this.wordChange$.next(motilis._id);

      res.status(200).send(motilis);
    } catch (error) {
      console.log(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(false);
    }
  }

  @Get('word')
  async getWordOfTheDay(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const dataQueryParams = req.query['date'];
      const motilis = await this.motilisService.findByDate(dataQueryParams);
      motilis.solution = Buffer.from(motilis.solution).toString('base64');
      motilis.link = Buffer.from(motilis.link).toString('base64');

      const response = {
        solution: motilis.solution,
        link: motilis.link,
        remainingTime: timeToMidnight()
      }
      res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.log(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(false);
    }
  }

}
