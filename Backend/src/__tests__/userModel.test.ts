import { User } from '../models';

test('User properties expose Sequelize attributes when creating sessions', () => {
    const user = User.build({
        email: 'model-test@example.com',
        username: 'model-test',
        name: 'Model',
        surname: 'Test',
        password: 'hashed-password',
    });

    expect(user.user_id).toEqual(expect.any(String));
    expect(user.user_id).toBe(user.getDataValue('user_id'));
    expect(user.email).toBe('model-test@example.com');
    expect(user.username).toBe('model-test');
    expect(user.email_verified).toBe(false);
    expect(user.is_moderator).toBe(false);

    user.setDataValue('email', 'updated@example.com');
    expect(user.email).toBe('updated@example.com');
});
