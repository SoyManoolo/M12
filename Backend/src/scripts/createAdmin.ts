import { hash } from 'bcryptjs';
import { User } from '../models/User';
import { sequelize } from '../config/database';

const required = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

async function createAdmin() {
    const username = required('BOOTSTRAP_ADMIN_USERNAME');
    const email = required('BOOTSTRAP_ADMIN_EMAIL');
    const name = required('BOOTSTRAP_ADMIN_NAME');
    const surname = required('BOOTSTRAP_ADMIN_SURNAME');
    const password = required('BOOTSTRAP_ADMIN_PASSWORD');

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{12,}$/;
    if (!strongPassword.test(password)) {
        throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be 12+ characters and include upper/lowercase, number, and special character');
    }

    await sequelize.authenticate();

    const existingUser = await User.findOne({
        where: { username }
    }) || await User.findOne({ where: { email } });

    if (existingUser) {
        throw new Error('An account with this username or email already exists');
    }

    await User.create({
        username,
        email,
        name,
        surname,
        password: await hash(password, 12),
        is_moderator: true
    });

    console.log(`Administrator '${username}' created successfully.`);
}

createAdmin()
    .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : 'Unable to create administrator');
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
