import { Policy, IPolicyDocument } from '../../models/Policy.js';
import { NotFoundError } from '../../utils/errors.js';

export class PolicyService {
  async listPolicies(category?: string): Promise<IPolicyDocument[]> {
    const filter: Record<string, unknown> = { isActive: true };
    if (category) {
      filter.category = category;
    }
    return Policy.find(filter).sort({ title: 1 });
  }

  async getPolicyById(id: string): Promise<IPolicyDocument> {
    const policy = await Policy.findById(id);
    if (!policy) {
      throw new NotFoundError('Policy not found');
    }
    return policy;
  }

  async createPolicy(data: {
    title: string;
    category: string;
    content: string;
    version?: string;
  }): Promise<IPolicyDocument> {
    return Policy.create({
      title: data.title,
      category: data.category,
      content: data.content,
      version: data.version || '1.0',
      isActive: true,
    });
  }

  async deletePolicy(id: string): Promise<void> {
    const policy = await Policy.findById(id);
    if (!policy) {
      throw new NotFoundError('Policy not found');
    }
    policy.isActive = false;
    await policy.save();
  }
}

export const policyService = new PolicyService();
