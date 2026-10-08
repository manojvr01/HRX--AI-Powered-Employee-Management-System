import { OrgSettings, IOrgSettingsDocument } from '../../models/OrgSettings.js';
import { Holiday, IHolidayDocument } from '../../models/Holiday.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { logAudit } from '../../services/auditService.js';
import { Request } from 'express';

export async function getSettings(): Promise<IOrgSettingsDocument> {
  let settings = await OrgSettings.findOne();
  if (!settings) {
    settings = await OrgSettings.create({
      companyName: 'HRX Global Technologies',
      timezone: 'Asia/Kolkata',
      lateThresholdMinutes: 15,
      workWeekDays: [1, 2, 3, 4, 5],
      workDayStartHour: 9,
      workDayEndHour: 18,
      currency: 'USD',
    });
  }
  return settings;
}

export async function updateSettings(
  updates: Record<string, any>,
  req?: Request
): Promise<IOrgSettingsDocument> {
  let settings = await OrgSettings.findOne();
  if (!settings) {
    settings = new OrgSettings();
  }

  if (updates.companyName) settings.companyName = updates.companyName;
  if (updates.timezone) settings.timezone = updates.timezone;
  if (updates.lateThresholdMinutes !== undefined) {
    settings.lateThresholdMinutes = updates.lateThresholdMinutes;
  }
  if (updates.workWeekDays) settings.workWeekDays = updates.workWeekDays;
  if (updates.workDayStartHour !== undefined) {
    settings.workDayStartHour = updates.workDayStartHour;
  }
  if (updates.workDayEndHour !== undefined) {
    settings.workDayEndHour = updates.workDayEndHour;
  }
  if (updates.currency) settings.currency = updates.currency;

  await settings.save();

  await logAudit({
    userId: req?.user?.id,
    action: 'SETTINGS_UPDATED',
    entity: 'OrgSettings',
    details: updates,
    req,
  });

  return settings;
}

export async function listHolidays(year?: number): Promise<IHolidayDocument[]> {
  const filter: Record<string, any> = {};
  if (year) filter.year = year;
  return Holiday.find(filter).sort({ date: 1 });
}

export async function createHoliday(
  data: { name: string; date: string; description?: string; isOptional?: boolean },
  req?: Request
): Promise<IHolidayDocument> {
  const existing = await Holiday.findOne({ date: data.date });
  if (existing) {
    throw new ConflictError(`A holiday on date ${data.date} already exists`);
  }

  const year = parseInt(data.date.split('-')[0], 10);

  const holiday = await Holiday.create({
    name: data.name,
    date: data.date,
    year,
    description: data.description,
    isOptional: data.isOptional || false,
  });

  await logAudit({
    userId: req?.user?.id,
    action: 'HOLIDAY_CREATED',
    entity: 'Holiday',
    entityId: holiday._id.toString(),
    details: { name: holiday.name, date: holiday.date },
    req,
  });

  return holiday;
}

export async function deleteHoliday(id: string, req?: Request): Promise<void> {
  const holiday = await Holiday.findById(id);
  if (!holiday) throw new NotFoundError('Holiday not found');

  await Holiday.findByIdAndDelete(id);

  await logAudit({
    userId: req?.user?.id,
    action: 'HOLIDAY_DELETED',
    entity: 'Holiday',
    entityId: id,
    req,
  });
}
