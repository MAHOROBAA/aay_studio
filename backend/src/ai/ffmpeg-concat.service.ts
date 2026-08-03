import { execFile } from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { BadRequestException, Injectable } from '@nestjs/common'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

@Injectable()
export class FfmpegConcatService {
  // 모든 장면 영상이 같은 모델/해상도로 생성되므로 재인코딩 없이(-c copy) 이어붙인다.
  // 코덱·해상도가 다른 영상이 섞이면 이 방식은 실패하거나 결과가 깨질 수 있다.
  async concat(videoBuffers: Buffer[]): Promise<Buffer> {
    if (videoBuffers.length < 2) {
      throw new BadRequestException('합칠 장면 영상은 2개 이상 필요합니다.')
    }
    if (!ffmpegPath) {
      throw new Error('ffmpeg-static 바이너리를 찾을 수 없어요.')
    }

    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aay-render-'))
    try {
      const inputPaths: string[] = []
      for (let i = 0; i < videoBuffers.length; i += 1) {
        const inputPath = path.join(workDir, `scene-${i}.mp4`)
        await fs.writeFile(inputPath, videoBuffers[i])
        inputPaths.push(inputPath)
      }

      const listPath = path.join(workDir, 'concat-list.txt')
      const listContent = inputPaths
        .map((inputPath) => `file '${inputPath.replace(/'/g, "'\\''")}'`)
        .join('\n')
      await fs.writeFile(listPath, listContent)

      const outputPath = path.join(workDir, 'output.mp4')
      await execFileAsync(ffmpegPath, [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listPath,
        '-c',
        'copy',
        outputPath,
      ])

      return await fs.readFile(outputPath)
    } finally {
      await fs
        .rm(workDir, { recursive: true, force: true })
        .catch(() => undefined)
    }
  }
}
