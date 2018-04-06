var global_helper = {};

global_helper.rename_keys = async (obj,new_keys) => {
    const key_values = await Object.keys(obj).map(key => {
        const new_key = new_keys[key] || key;
        return { [new_key]: obj[key] };
    });
    return Object.assign({}, ...key_values);
}

module.exports = global_helper;