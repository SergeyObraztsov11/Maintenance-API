import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function bcryptHashPassword(password) {
    return bcrypt.hash(password, ROUNDS);
}

export function bcryptCheckPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}
