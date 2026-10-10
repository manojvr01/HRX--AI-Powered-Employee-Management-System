import { Request, Response } from 'express';
import { policyService } from './policyService.js';
import { createPolicySchema } from '@hrx/shared';

export class PolicyController {
  async listPolicies(req: Request, res: Response): Promise<void> {
    const policies = await policyService.listPolicies(req.query.category as string);
    res.status(200).json({
      success: true,
      data: policies,
    });
  }

  async getPolicyById(req: Request, res: Response): Promise<void> {
    const policy = await policyService.getPolicyById(req.params.id as string);
    res.status(200).json({
      success: true,
      data: policy,
    });
  }

  async createPolicy(req: Request, res: Response): Promise<void> {
    const data = createPolicySchema.parse(req.body);
    const policy = await policyService.createPolicy(data);
    res.status(201).json({
      success: true,
      data: policy,
      message: 'Policy created successfully',
    });
  }

  async deletePolicy(req: Request, res: Response): Promise<void> {
    await policyService.deletePolicy(req.params.id as string);
    res.status(200).json({
      success: true,
      message: 'Policy deactivated successfully',
    });
  }
}

export const policyController = new PolicyController();
