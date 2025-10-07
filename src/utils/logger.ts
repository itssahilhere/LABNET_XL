
interface ErrorLog {
    userId: string | number;
    functionName: string;
    errorMsg: string;
}

interface SuccessLog {
    userId: string | number;
    functionName: string;
    successMsg: string;
}

export function logError({ userId, functionName, errorMsg }: ErrorLog): void {
    const dateTime = new Date().toISOString();
    console.error(
        `[ERROR] [${dateTime}] [User: ${userId}] [Function: ${functionName}] - ${errorMsg}`
    );
}

export function logSuccess({
    userId,
    functionName,
    successMsg,
}: SuccessLog): void {
    const dateTime = new Date().toISOString();
    console.log(
        `[SUCCESS] [${dateTime}] [User: ${userId}] [Function: ${functionName}] - ${successMsg}`
    );
}
