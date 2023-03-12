import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { Octokit } from '@octokit/rest';
import { PullRequestEvent } from '@octokit/webhooks-definitions/schema';

@Injectable()
export class AppService {
  private openai: OpenAIApi;
  private octokit: Octokit;

  //PR TEST
  //branch

  constructor() {
    // OpenAI API 인증 정보
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);

    // GitHub API 인증 정보
    this.octokit = new Octokit({
      auth: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
    });
  }

  async createReview(pullRequest: PullRequestEvent) {
    // PR에 대한 정보를 가져옴
    const { data: pr } = await this.octokit.pulls.get({
      owner: pullRequest.repository.owner.login,
      repo: pullRequest.repository.name,
      pull_number: pullRequest.number,
    });

    // PR의 diff를 가져옴
    const { data: diff } = await this.octokit.pulls.get({
      owner: pullRequest.repository.owner.login,
      repo: pullRequest.repository.name,
      pull_number: pullRequest.number,
      mediaType: {
        format: 'diff',
      },
    });

    // diff를 GPT-3 API에 전송하여 리뷰 작성
    const prompt = `
      Review the following code changes:

      ${diff}
      
      Suggested review comments:
    `;
    const response = await this.openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 1024,
      n: 1,
      stop: ['Suggested review comments:'],
    });

    // 리뷰를 PR에 작성
    await this.octokit.pulls.createReview({
      owner: pullRequest.repository.owner.login,
      repo: pullRequest.repository.name,
      pull_number: pullRequest.number,
      commit_id: pr.head.sha,
      event: 'COMMENT',
      body: response.data.choices[0].text,
    });
  }
}
