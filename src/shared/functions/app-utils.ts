import crypto from 'crypto';
import { differenceInDays, isWithinInterval, addDays } from "date-fns";
import { ClientSubscriptionData } from '../../models/client-subscriptions.model';

export const getFormattedDate = (dateString: string) => new Date(dateString).toLocaleDateString();

export const isLeftDateLessThanRightDate = (dateLeft: Date, dateRight: Date) => differenceInDays(dateLeft, dateRight) < 0;

export const isDateWithinInterval = (date: Date, startDate: Date, endDate: Date) => isWithinInterval(date, {
    start: startDate,
    end: endDate
});

export const addDaysToDate = (date: Date, numberOfDays: number) => addDays(date, numberOfDays);

export const generateRandom32bitHash = () => {
    const buffer = crypto.randomBytes(256);
    return crypto
        .createHash('sha1')
        .update(buffer)
        .digest('hex');
}

export const getActiveSubscription = (subscriptionList: ClientSubscriptionData[]) => {
    const today = getToday();
    const activeSubscription = subscriptionList.find((s) => {
        if (s.startDate && s.endDate && isDateWithinInterval(today, s.startDate, s.endDate)) {
            return true;
        }
    });
    return activeSubscription;
}

export const getToday = () => new Date();