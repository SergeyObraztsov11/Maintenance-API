import bcrypt from "bcryptjs";

const ROUNDS = 10;

export const bcryptHashPassword = async (password) => {
    const hashedPassword = await bcrypt.hash(password, ROUNDS);
    return hashedPassword;
};

export const bcryptCheckPassword = async (password, hashedPassword) => {
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    return isPasswordValid;
};
