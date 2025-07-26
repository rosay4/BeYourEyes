// services/VideoProcessingService.ts
import * as FileSystem from 'expo-file-system';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

class VideoProcessingService {
  /**
   * 从视频的指定时间点开始，抽取出16帧图片
   * @param videoUri 输入的视频文件 URI
   * @param startTimeInSeconds 抽帧的开始时间（秒）
   * @returns 返回一个包含16张图片本地URI的数组
   */
  async extractFrames(
    videoUri: string,
    startTimeInSeconds: number
  ): Promise<string[]> {
    
    // 1. 创建一个唯一的临时输出目录，避免文件冲突
    const outputDir = `${FileSystem.cacheDirectory}ffmpeg_output_${Date.now()}`;
    await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });

    // 2. 构建 FFmpeg 命令
    // -ss {start_time}: 从指定时间开始
    // -i {input_uri}: 输入文件
    // -t 2: 持续2秒
    // -r 8: 帧率为每秒8帧 (2s * 8fps = 16 frames)
    // -f image2: 输出格式为图片序列
    // -q:v 2: 输出图片质量 (1-31, 数字越小质量越高)
    // {output_path}: 输出路径和命名格式
    const command = `-ss ${startTimeInSeconds} -i "${videoUri}" -t 2 -r 8 -f image2 -q:v 2 "${outputDir}/frame_%d.jpg"`;

    console.log("执行 FFmpeg 命令:", command);

    // 3. 执行命令并等待结果
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    // 4. 检查执行结果
    if (ReturnCode.isSuccess(returnCode)) {
      console.log("FFmpeg 抽帧成功！");
      // 读取输出目录，生成16个图片文件的URI列表
      const frameUris = Array.from(
        { length: 16 },
        (_, i) => `${outputDir}/frame_${i + 1}.jpg`
      );
      console.log("生成的帧文件:", frameUris);
      return frameUris;
    } else if (ReturnCode.isCancel(returnCode)) {
      console.log("FFmpeg 操作被取消。");
      throw new Error('FFmpeg operation was canceled');
    } else {
      console.error("FFmpeg 执行失败。");
      const logs = await session.getLogsAsString();
      console.error("FFmpeg 日志:", logs);
      throw new Error(`FFmpeg failed with return code ${returnCode}`);
    }
  }
   /**
   * 将单张图片像素化为 8x8 的灰度数据
   * @param imageUri 输入图片 URI
   * @returns 返回一个包含 64 个灰度值 (0-255) 的数组
   */
  async pixelateImage(imageUri: string): Promise<Uint8Array> {
    // 1. 定义输出的二进制文件名
    const outputUri = `${imageUri}.bin`;

    // 2. 构建 FFmpeg 命令
    // -i {input}: 输入图片
    // -vf "scale=8:8,format=gray": 视频滤镜 (vf)
    //    - scale=8:8 : 将图片强制缩放为 8x8 像素
    //    - format=gray: 将颜色转为灰度
    // -f rawvideo: 输出为原始视频数据（无压缩、无容器）
    const command = `-i "${imageUri}" -vf "scale=8:8,format=gray" -f rawvideo "${outputUri}"`;

    // 3. 执行命令
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    // 4. 检查结果并读取数据
    if (ReturnCode.isSuccess(returnCode)) {
      // 读取生成的二进制文件内容
      const binaryContent = await FileSystem.readAsStringAsync(outputUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 将 Base64 字符串解码为字节数组 (Uint8Array)
      const decoded = Uint8Array.from(atob(binaryContent), c => c.charCodeAt(0));
      
      // 删除临时的二进制文件
      await FileSystem.deleteAsync(outputUri);
      
      return decoded; // 返回包含 64 个灰度值的数组
    } else {
      console.error("FFmpeg 像素化失败。");
      const logs = await session.getLogsAsString();
      console.error("FFmpeg 日志:", logs);
      throw new Error(`FFmpeg failed to pixelate image with code ${returnCode}`);
    }
  }
}

export default new VideoProcessingService();