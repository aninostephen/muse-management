import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest } from './jwt-auth.guard';
import { Public } from './public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with email and password to receive a Bearer JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated; returns JWT accessToken and user profile.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password.',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Get currently authenticated user profile from the Bearer JWT token',
  })
  async getMe(@Req() req: AuthenticatedRequest) {
    const u = req.user;
    return {
      user: u
        ? {
            id: u.sub,
            email: u.email,
            name: u.name,
            role: u.role,
          }
        : null,
    };
  }
}
