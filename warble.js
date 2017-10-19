{

	let specificTypes = {};

	[
		'Array',
		'Boolean',
		'Date',
		'Error',
		'Function',
		'Number',
		'Object',
		'RegExp',
		'String',
		'Symbol'
	]

		.forEach(value => specificTypes[`[object ${value}]`] = value.toLowerCase());

	class Core {

		constructor() {

			this.regex = {
				email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
				numeric: /^\-?\d+(?:\.\d+)?$/,
				integer: /^\-?\d+$/,
				positive: /^\d+(?:\.\d+)?$/,
				negative: /^\-\d+(?:\.\d+)?$/
			};

			var { regex } = this;

			this.subtypes = {
				email: value => regex.email.test(value),
				numeric: value => regex.numeric.test(value),
				integer: value => regex.integer.test(value),
				positive: value => regex.positive.test(value),
				negative: value => regex.negative.test(value),
				even: value => value % 2 === 0,
				odd: value => value % 2 > 0
			};

			this.validations = {
				required: (value, isRequired) => isRequired ? value !== undefined : true,
				pattern: (value, pattern) => (core.is(pattern, 'regexp') ? pattern : new RegExp(pattern)).test(value),
				min: (value, min = -Infinity) => (Number(value) || 0) >= (Number(min) || 0),
				max: (value, max = Infinity) => (Number(value) || 0) <= (Number(max) || 0),
				minlength: (value, min = 0) => typeof value === 'string' ? value.length >= (Number(min) || 0) : false,
				maxlength: (value, max = Infinity) => typeof value === 'string' ? value.length <= (Number(max) || 0) : false,
				type: (value, type) => core.type(value) === type,
				is: (value, types) => core.is(value, types, true),
				range: (value, range = [-Infinity, Infinity]) => (core.is(range, 'array') && range.length > 1) ? Number(value) >= Number(range[0]) && Number(value) <= Number(range[1]) : false,
				equal(value, to)  {

					return typeof this === 'object' && this.hasOwnProperty(to) ? value === this[to] : false;

				},
				conditional: (value, conditional) => conditional(value),
				options(value, options) {

					if (core.is(options, 'array'))

						for (let index = 0, size = options.length; index < size; index++)

							if (value === options[index])

								return true;

					return false;

				},
				instance: (value, object) => value instanceof object
			};

		}

		type(value) {

			return value === null ? 'null' : (typeof value === 'object' || typeof value === 'function' ? specificTypes[specificTypes.toString.call(value)] || 'object' : typeof value);

		}

		is(value, types, getDetails) {

			var

				response = {},

				{ subtypes, type } = this;

			if (type(types) === 'array') {

				for (let index = 0, size = types.length; index < size; index++) {

					let test = subtypes[types[index]];

					if (typeof test === 'function')

						response[types[index]] = test.call(this, value);

					else

						response[types[index]] = type(value) === types[index];

				}

			} else if (typeof subtypes[types] === 'function')

				response[types] = subtypes[types].call(this, value);

			else

				response[types] = type(value) === types;

			if (getDetails)

				return response;

			for (let index in response)

				if (!response[index])

					return false;

			return true;

		}

	}

	let core = new Core;

	class Response {

		constructor() {

			this.data = {};

			this.valid = true;

		}

		setData(index, value) {

			this.data[index] = value;

			if (!value.valid)

				this.valid = false;

		}

	}

	class ResponseFragment {

		constructor(value) {

			this.value = value;

			this.valid = true;

			this.status = {};

		}

		validate(name, param, parent) {

			var response = typeof core.validations[name] === 'function' ? core.validations[name].call(parent, this.value, param) : true;

			if (!response)

				this.valid = false;

			if (typeof response === 'object') {

				let status = true;

				for (let index in response) {

					this.status[name + index[0].toUpperCase() + index.substr(1)] = response[index];

					if (!response[index])

						status = false;

				}

				this.status[name] = status;

			} else

				this.status[name] = response;

			return this;

		}

	}

	class Model {

		constructor(model) {

			if (typeof model === 'object')

				this.model = model;

			else

				throw new Error('The expected param must be an object.');

		}

		validate(data) {

			if (typeof data === 'object') {

				let response = new Response;

				for (let index in this.model) {

					let value = new ResponseFragment(data[index]);

					if (this.model[index] instanceof Model)

						response.setData(index, this.model[index].validate(data[index]));

					else if (typeof this.model[index] === 'object') {

						for (let validation in this.model[index])

							value.validate(validation, this.model[index][validation], data)

						response.setData(index, value);

					}

				}

				return response;

			} else

				throw new Error('The expected param must be an object.');

		}

	}

	class Warble extends Core {

		model(model) {

			return new Model(model);

		}

		validate(value, options) {

			if (typeof options === 'object') {

				var value = new ResponseFragment(value);

				for (let index in options)

					value.validate(index, options[index]);

				return value;

			} else

				throw error('The expected param must be an object.');

		}

	}

	var warble = new Warble;

	if (typeof module === 'object' && typeof module.exports === 'object')

		module.exports = warble;

}
