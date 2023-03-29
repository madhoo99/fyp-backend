const errors = {'E001': 'There is a game in progress.'};

function getError(errorCode) {
    return {'error': {
        'code': errorCode,
        'message': errors[errorCode]
    }};
};

module.exports = { getError };