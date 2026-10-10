import { Request, Response } from 'express';
import { askAiAssistantSchema } from '@hrx/shared';
import { aiService } from '../../services/aiService.js';
import { Policy } from '../../models/Policy.js';
import { LeaveBalance } from '../../models/LeaveBalance.js';
import { Attendance } from '../../models/Attendance.js';
import { Employee } from '../../models/Employee.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class AiController {
  async askAssistant(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const { question, history } = askAiAssistantSchema.parse(req.body);
    const currentUser = req.user;

    // 1. Gather all active company policies
    const policies = await Policy.find({ isActive: true }).select('title category content');
    const policiesText = policies
      .map((p) => `### POLICY: ${p.title} (Category: ${p.category})\n${p.content}`)
      .join('\n\n');

    // 2. Gather caller's own authorized context
    let callerContext = `Caller Email: ${currentUser.email}\nRole: ${currentUser.role}`;
    if (currentUser.employeeId) {
      const emp = await Employee.findById(currentUser.employeeId);
      if (emp) {
        callerContext += `\nEmployee Code: ${emp.employeeCode}\nName: ${emp.firstName} ${emp.lastName}\nPosition: ${emp.position}`;
      }

      const currentYear = new Date().getFullYear();
      const balances = await LeaveBalance.find({
        employeeId: currentUser.employeeId,
        year: currentYear,
      }).populate('leaveTypeId', 'name');

      if (balances.length > 0) {
        callerContext += '\nLeave Balances (' + currentYear + '): ' +
          balances
            .map((b) => {
              const name = (b.leaveTypeId as unknown as { name?: string })?.name || 'Leave';
              return `${name}: ${b.remainingDays} remaining (${b.usedDays} used)`;
            })
            .join(', ');
      }

      const attendanceCount = await Attendance.countDocuments({
        employeeId: currentUser.employeeId,
      });
      callerContext += `\nTotal Recorded Attendance Days: ${attendanceCount}`;
    }

    const contextData = `${policiesText}\n\n=== CALLER OWN PROFILE & BALANCES (Confidential to caller only) ===\n${callerContext}`;

    const answer = await aiService.answerPolicyQuestion({
      question,
      history,
      contextData,
    });

    res.status(200).json({
      success: true,
      data: {
        answer,
      },
    });
  }
}

export const aiController = new AiController();
