import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { RequestUser } from '../auth/auth.types'
import { StorageService } from './storage.service'
import type {
  CreateDownloadUrlResult,
  CreateUploadUrlRequest,
  CreateUploadUrlResult,
} from './storage.types'

@Controller('storage')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-url')
  createUploadUrl(
    @CurrentUser() user: RequestUser,
    @Body() body: CreateUploadUrlRequest,
  ): Promise<CreateUploadUrlResult> {
    return this.storageService.createUploadUrl(
      user.id,
      body.path,
      body.contentType,
    )
  }

  @Get('download-url')
  createDownloadUrl(
    @CurrentUser() user: RequestUser,
    @Query('objectKey') objectKey: string,
  ): Promise<CreateDownloadUrlResult> {
    return this.storageService.createDownloadUrl(user.id, objectKey)
  }
}
