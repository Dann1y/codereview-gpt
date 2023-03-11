import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { PullRequestEvent } from '@octokit/webhooks-definitions/schema';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/webhook')
  async handleWebhook(@Body() body: PullRequestEvent) {
    if (body.action === 'opened') {
      // PR이 처음 열린 경우, 자동으로 리뷰 작성
      await this.appService.createReview(body);
    }
  }
}
