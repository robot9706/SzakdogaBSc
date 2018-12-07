const initialState = {
    user_logged_in: false,
    token: null,
    username: null,
    balance: 0
};

export const ACTION_USER_LOGGEDIN = "ACTION_USER_LOGGEDIN";
export const ACTION_USER_LOGOUT = "ACTION_USER_LOGOUT";
export const ACTION_USER_BALANCECHANGE = "ACTION_USER_BALANCECHANGE";

export function user(state = initialState, action) {
    switch (action.type) {
        case ACTION_USER_LOGGEDIN:
            return {
                ...state,
                user_logged_in: true,
                token: action.token,
                username: action.username,
                balance: action.balance
            };
        case ACTION_USER_LOGOUT:
            return {
                ...state,
                user_logged_in: false,
                token: null,
                username: null,
                balance: 0
            };
        case ACTION_USER_BALANCECHANGE:
            return {
                ...state,
                balance: action.balance
            };
    }

    return state;
}

export function user_onlogin(data) {
    return {
        type: ACTION_USER_LOGGEDIN,
        token: data.token,
        username: data.name,
        balance: data.balance
    }
}

export function user_logout() {
    return {
        type: ACTION_USER_LOGOUT
    }
}

export function user_balancechange(newBalance) {
    return {
        type: ACTION_USER_BALANCECHANGE,
        balance: newBalance
    }
}