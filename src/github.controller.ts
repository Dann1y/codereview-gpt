import OpenAI from 'openai-api';
import { Octokit } from '@octokit/rest';
import { PullRequestEvent } from '@octokit/webhooks-definitions/schema';
import { Body, Controller, Post } from '@nestjs/common';

// GPT-3 API 인증 정보
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// GitHub API 인증 정보
const octokit = new Octokit({
  auth: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
});

async function createReview(pullRequest: PullRequestEvent) {
  // PR에 대한 정보를 가져옴
  const { data: pr } = await octokit.pulls.get({
    owner: pullRequest.repository.owner.login,
    repo: pullRequest.repository.name,
    pull_number: pullRequest.number,
  });

  // PR의 diff를 가져옴
  const { data: diff } = await octokit.pulls.get({
    owner: pullRequest.repository.owner.login,
    repo: pullRequest.repository.name,
    pull_number: pullRequest.number,
    mediaType: {
      format: 'diff',
    },
  });

  // diff를 GPT-3 API에 전송하여 리뷰 작성
  const response = await openai.complete({
    engine: 'davinci-codex',
    prompt: `
      Review the following code changes:

      ${diff}
      
      Suggested review comments:
    `,
    maxTokens: 1024,
    n: 1,
    stop: ['Suggested review comments:'],
  });

  // 리뷰를 PR에 작성
  await octokit.pulls.createReview({
    owner: pullRequest.repository.owner.login,
    repo: pullRequest.repository.name,
    pull_number: pullRequest.number,
    commit_id: pr.head.sha,
    event: 'COMMENT',
    body: response.data.choices[0].text,
  });
}

// Nest.js에서 webhook을 처리하는 코드
@Controller()
export class AppController {
  @Post('/webhook')
  async handleWebhook(@Body() body: PullRequestEvent) {
    if (body.action === 'opened') {
      // PR이 처음 열린 경우, 자동으로 리뷰 작성
      await createReview(body);
    }
  }
}
