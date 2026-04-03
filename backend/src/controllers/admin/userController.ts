// src/controllers/admin/userController.ts
import { Response, NextFunction } from 'express';
import {
  createUser,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
  assignCustomerToUser,
  removeCustomerFromUser,
  getUserCustomers,
  CreateUserData,
  UpdateUserData,
} from '../../services/admin/user.service.js';
import { hasTenantAccess, isSuperAdmin } from '../../middleware/admin/tenant.js';
import { AdminRequest } from '../../middleware/admin/auth.js';
import {
  createUserSchema,
  updateUserSchema,
  assignCustomerSchema,
  listUsersQuerySchema,
  CreateUserInput,
} from '../../validations/admin/user.validation.js';

/**
 * 获取用户列表
 * GET /api/admin/users
 */
export async function listUsers(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requesterId = req.adminUser?.id;
    if (!requesterId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    // 验证查询参数
    const validatedQuery = listUsersQuerySchema.safeParse(req.query);
    if (!validatedQuery.success) {
      res.status(400).json({
        success: false,
        error: '参数验证失败',
        details: validatedQuery.error.flatten(),
      });
      return;
    }

    const { customerId, enabled, search } = validatedQuery.data;

    const users = await getUsers({
      requesterId,
      customerId,
      enabled: enabled === 'true' ? true : enabled === 'false' ? false : undefined,
      search,
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取单个用户
 * GET /api/admin/users/:id
 */
export async function getUser(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const requesterId = req.adminUser?.id;
    if (!requesterId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);
    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    // 权限检查：非超级管理员只能查看自己客户的用户
    if (user.customerId && !(await hasTenantAccess(requesterId, user.customerId))) {
      res.status(403).json({ success: false, error: '无权访问该用户' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * 创建用户
 * POST /api/admin/users
 */
export async function createUserController(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requesterId = req.adminUser?.id;
    if (!requesterId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    // 验证请求体
    const validated = createUserSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: validated.error.flatten(),
      });
      return;
    }

    const data: CreateUserInput = validated.data;
    const { customerId, isSuperAdmin: isSuperAdminFlag } = data;

    // 权限检查：非超级管理员不能创建超级管理员
    if (isSuperAdminFlag && !(await isSuperAdmin(requesterId))) {
      res.status(403).json({ success: false, error: '只有超级管理员可以创建超级管理员' });
      return;
    }

    // 权限检查：只能在自己有权限的客户下创建用户
    if (customerId && !(await hasTenantAccess(requesterId, customerId))) {
      res.status(403).json({ success: false, error: '无权在该客户下创建用户' });
      return;
    }

    const user = await createUser(data as CreateUserData);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新用户
 * PUT /api/admin/users/:id
 */
export async function updateUserController(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requesterId = req.adminUser?.id;
    if (!requesterId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);
    const existingUser = await getUserById(userId);

    if (!existingUser) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    // 权限检查：只能修改自己客户的用户（或自己）
    if (
      existingUser.customerId &&
      !(await hasTenantAccess(requesterId, existingUser.customerId)) &&
      existingUser.id !== requesterId
    ) {
      res.status(403).json({ success: false, error: '无权修改该用户' });
      return;
    }

    // 验证请求体
    const validated = updateUserSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: validated.error.flatten(),
      });
      return;
    }

    const user = await updateUser(userId, validated.data as UpdateUserData, { requesterId });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除用户
 * DELETE /api/admin/users/:id
 */
export async function deleteUserController(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requesterId = req.adminUser?.id;
    if (!requesterId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    // 只有超级管理员可以删除用户
    if (!(await isSuperAdmin(requesterId))) {
      res.status(403).json({ success: false, error: '只有超级管理员可以删除用户' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);

    // 不能删除自己
    if (userId === requesterId) {
      res.status(400).json({ success: false, error: '不能删除自己' });
      return;
    }

    await deleteUser(userId);
    res.json({ success: true, message: '用户已删除' });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取用户的客户列表
 * GET /api/admin/users/:id/customers
 */
export async function listUserCustomers(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requesterId = req.adminUser?.id;
    if (!requesterId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);

    // 权限检查：只能查看自己或下属用户的客户列表
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    // 超级管理员可以查看所有，普通用户只能查看自己的
    if (!(await isSuperAdmin(requesterId)) && userId !== requesterId) {
      res.status(403).json({ success: false, error: '无权查看该用户的客户列表' });
      return;
    }

    const customers = await getUserCustomers(userId);
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
}

/**
 * 分配客户给用户
 * POST /api/admin/users/:id/customers
 */
export async function assignCustomer(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requesterId = req.adminUser?.id;
    if (!requesterId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);

    // 验证请求体
    const validated = assignCustomerSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: validated.error.flatten(),
      });
      return;
    }

    const { customerId, role } = validated.data;

    // 权限检查：只能分配自己有权限的客户
    if (!(await hasTenantAccess(requesterId, customerId))) {
      res.status(403).json({ success: false, error: '无权分配该客户' });
      return;
    }

    const assignment = await assignCustomerToUser(userId, customerId, role);
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
}

/**
 * 移除用户的客户分配
 * DELETE /api/admin/users/:id/customers/:customerId
 */
export async function removeCustomer(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requesterId = req.adminUser?.id;
    if (!requesterId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);
    const customerId = parseInt(req.params.customerId as string, 10);

    // 权限检查：只能移除自己有权限的客户
    if (!(await hasTenantAccess(requesterId, customerId))) {
      res.status(403).json({ success: false, error: '无权操作该客户' });
      return;
    }

    // 权限检查：只能修改自己有权限的用户
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    if (!(await isSuperAdmin(requesterId)) && userId !== requesterId) {
      res.status(403).json({ success: false, error: '无权修改该用户' });
      return;
    }

    await removeCustomerFromUser(userId, customerId);
    res.json({ success: true, message: '已移除客户分配' });
  } catch (error) {
    next(error);
  }
}
