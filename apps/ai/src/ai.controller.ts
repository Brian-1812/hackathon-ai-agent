import { createStream } from '@app/common';
import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { AiService } from './ai.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { toFile } from 'openai/uploads';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async answerQuery(@Body() body: { query: string }, @Res() res: Response) {
    const stream = createStream(this.aiService.chatFlow(body.query));
    const reader = stream.getReader();
    while (true) {
      let { value, done } = await reader.read();
      if (value?.content) {
        res.write(JSON.stringify(value));
      }
      if (value?.type === 'response' || done) {
        break;
      }
    }
    res.end();
  }

  @Post('chat/audio')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (file) {
      // Create FileLike type for uploading to OpenAI
      const audio = await toFile(Buffer.from(file.buffer), 'audio.webm');
      const stream = createStream(this.aiService.chatFlowAudio(audio));
      const reader = stream.getReader();
      while (true) {
        let { value, done } = await reader.read();
        if (value?.content) {
          res.write(JSON.stringify(value));
        }
        if (value?.type === 'response' || done) {
          break;
        }
      }
      res.end();
    }
  }

  @Post('store/add')
  async addIntoVectorStore(@Body() data: CreateStoreDto) {
    return await this.aiService.createStoreFromText(data.content);
  }
}
