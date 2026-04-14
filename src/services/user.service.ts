import { APIError } from "../errors/APIError.js";
import * as userRepo from "../repositories/user.repository.js";
export function findById(id: string) {
    const user = userRepo.findById(id);
    if (!user) throw new APIError(`User with ID ${id} not found`, 404);
    return user;
}
