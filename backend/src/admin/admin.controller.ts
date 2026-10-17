import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,

  Request,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import { NuggetsService } from "../nuggets/nuggets.service";
import { CreateNuggetDto } from "../nuggets/dto/create-nugget.dto";
import { UpdateNuggetDto } from "../nuggets/dto/update-nugget.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly nuggetsService: NuggetsService) {}

  @Get("test")
  testAdminAccess(@Request() req: any) {
    return {
      message: "Admin access granted",
      user: {
        id: req.user.sub,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }

  @Post("nuggets")
  createNugget(@Body() dto: CreateNuggetDto) {
    return this.nuggetsService.createNugget(dto);
  }

  @Get("nuggets")
  getAllNuggets() {
    return this.nuggetsService.getAllNuggetsForAdmin();
  }

  @Patch("nuggets/:id")
updateNugget(
  @Param("id") id: string,
  @Body() dto: UpdateNuggetDto
) {
  return this.nuggetsService.updateNugget(id, dto);
}

@Delete("nuggets/:id")
deleteNugget(@Param("id") id: string) {
  return this.nuggetsService.deleteNugget(id);
}

}