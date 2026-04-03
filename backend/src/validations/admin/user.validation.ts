// src/validations/admin/user.validation.ts
import { z } from 'zod'

/**
 * 用户创建验证schema
 */
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[\w-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
  email: z.string().email('邮箱格式不正确').max(100, '邮箱最多100个字符'),
  password: z
    .string()
    .min(8, '密码至少8个字符')
    .max(128, '密码最多128个字符')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  name: z.string().max(100, '姓名最多100个字符').optional(),
  customerId: z.number().int().positive('客户ID必须是正整数').optional().nullable(),
  isSuperAdmin: z.boolean().optional(),
  roleIds: z.array(z.number().int().positive('角色ID必须是正整数')).optional(),
})

/**
 * 用户更新验证schema
 */
export const updateUserSchema = z.object({
  name: z.string().max(100, '姓名最多100个字符').optional(),
  email: z.string().email('邮箱格式不正确').max(100, '邮箱最多100个字符').optional(),
  password: z
    .string()
    .min(8, '密码至少8个字符')
    .max(128, '密码最多128个字符')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .optional(),
  enabled: z.boolean().optional(),
  customerId: z.number().int().positive('客户ID必须是正整数').optional().nullable(),
  isSuperAdmin: z.boolean().optional(),
  roleIds: z.array(z.number().int().positive('角色ID必须是正整数')).optional(),
})

/**
 * 客户分配验证schema
 */
export const assignCustomerSchema = z.object({
  customerId: z.number().int().positive('客户ID必须是正整数'),
  role: z.enum(['viewer', 'editor', 'admin'], {
    errorMap: () => ({ message: '角色必须是 viewer、editor 或 admin' }),
  }).optional().default('viewer'),
})

/**
 * 用户列表查询验证schema
 */
export const listUsersQuerySchema = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  enabled: z.enum(['true', 'false']).optional(),
  search: z.string().max(100).optional(),
})

/**
 * 验证结果类型
 */
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type AssignCustomerInput = z.infer<typeof assignCustomerSchema>
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>