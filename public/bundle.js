
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.14.1 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.navOption = list[i];
    	return child_ctx;
    }

    // (46:0) {#if selected == PAGE.welcome}
    function create_if_block_8(ctx) {
    	let h1;
    	let t1;
    	let button;
    	let t2;
    	let button_nextpage_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Welcome to Overpass";
    			t1 = space();
    			button = element("button");
    			t2 = text("Get Started");
    			add_location(h1, file, 46, 1, 878);
    			attr_dev(button, "nextpage", button_nextpage_value = ctx.PAGE.start);
    			add_location(button, file, 47, 1, 908);
    			dispose = listen_dev(button, "click", ctx.gotoPage, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(46:0) {#if selected == PAGE.welcome}",
    		ctx
    	});

    	return block;
    }

    // (52:0) {#if selected == PAGE.start}
    function create_if_block_6(ctx) {
    	let h1;
    	let t1;
    	let select;
    	let option;
    	let t3;
    	let p;
    	let t4;
    	let t5_value = (ctx.selected ? ctx.selected.id : "[waiting...]") + "";
    	let t5;
    	let dispose;
    	let each_value = ctx.navOptions;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Getting Started?";
    			t1 = space();
    			select = element("select");
    			option = element("option");
    			option.textContent = "Select a View";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			p = element("p");
    			t4 = text("selected navOption ");
    			t5 = text(t5_value);
    			add_location(h1, file, 52, 1, 1021);
    			option.__value = "0";
    			option.value = option.__value;
    			attr_dev(option, "default", "");
    			add_location(option, file, 54, 2, 1113);
    			if (ctx.selected === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			add_location(select, file, 53, 1, 1048);
    			add_location(p, file, 63, 1, 1330);

    			dispose = [
    				listen_dev(select, "change", ctx.select_change_handler),
    				listen_dev(select, "change", ctx.change_handler, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selected);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t4);
    			append_dev(p, t5);
    		},
    		p: function update(changed, ctx) {
    			if (changed.navOptions || changed.PAGE) {
    				each_value = ctx.navOptions;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (changed.selected) {
    				select_option(select, ctx.selected);
    			}

    			if (changed.selected && t5_value !== (t5_value = (ctx.selected ? ctx.selected.id : "[waiting...]") + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(52:0) {#if selected == PAGE.start}",
    		ctx
    	});

    	return block;
    }

    // (57:3) {#if navOption.id > PAGE.start}
    function create_if_block_7(ctx) {
    	let option;
    	let t0_value = ctx.navOption.text + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = ctx.navOption.id;
    			option.value = option.__value;
    			add_location(option, file, 57, 4, 1233);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(57:3) {#if navOption.id > PAGE.start}",
    		ctx
    	});

    	return block;
    }

    // (56:2) {#each navOptions as navOption}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = ctx.navOption.id > ctx.PAGE.start && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(changed, ctx) {
    			if (ctx.navOption.id > ctx.PAGE.start) if_block.p(changed, ctx);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(56:2) {#each navOptions as navOption}",
    		ctx
    	});

    	return block;
    }

    // (67:0) {#if selected == PAGE.map1}
    function create_if_block_5(ctx) {
    	let h1;
    	let t1;
    	let button;
    	let t2;
    	let button_nextpage_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Map 1 - Diamond Interchange";
    			t1 = space();
    			button = element("button");
    			t2 = text("Nav Menu");
    			add_location(h1, file, 67, 1, 1434);
    			attr_dev(button, "nextpage", button_nextpage_value = ctx.PAGE.start);
    			add_location(button, file, 69, 1, 1473);
    			dispose = listen_dev(button, "click", ctx.gotoPage, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(67:0) {#if selected == PAGE.map1}",
    		ctx
    	});

    	return block;
    }

    // (75:0) {#if selected == PAGE.map2}
    function create_if_block_4(ctx) {
    	let h1;
    	let t1;
    	let button;
    	let t2;
    	let button_nextpage_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Map 2 - Tight Diamond Interchange";
    			t1 = space();
    			button = element("button");
    			t2 = text("Nav Menu");
    			add_location(h1, file, 75, 1, 1607);
    			attr_dev(button, "nextpage", button_nextpage_value = ctx.PAGE.start);
    			add_location(button, file, 77, 1, 1652);
    			dispose = listen_dev(button, "click", ctx.gotoPage, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(75:0) {#if selected == PAGE.map2}",
    		ctx
    	});

    	return block;
    }

    // (82:0) {#if selected === PAGE.map3}
    function create_if_block_3(ctx) {
    	let h1;
    	let t1;
    	let button;
    	let t2;
    	let button_nextpage_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Map 3";
    			t1 = space();
    			button = element("button");
    			t2 = text("Nav Menu");
    			add_location(h1, file, 82, 1, 1762);
    			attr_dev(button, "nextpage", button_nextpage_value = ctx.PAGE.start);
    			add_location(button, file, 84, 1, 1779);
    			dispose = listen_dev(button, "click", ctx.gotoPage, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(82:0) {#if selected === PAGE.map3}",
    		ctx
    	});

    	return block;
    }

    // (89:0) {#if selected === PAGE.map4}
    function create_if_block_2(ctx) {
    	let h1;
    	let t1;
    	let button;
    	let t2;
    	let button_nextpage_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Map 4 - Diverging Diamond Interchange";
    			t1 = space();
    			button = element("button");
    			t2 = text("Nav Menu");
    			add_location(h1, file, 89, 1, 1889);
    			attr_dev(button, "nextpage", button_nextpage_value = ctx.PAGE.start);
    			add_location(button, file, 91, 1, 1938);
    			dispose = listen_dev(button, "click", ctx.gotoPage, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(89:0) {#if selected === PAGE.map4}",
    		ctx
    	});

    	return block;
    }

    // (96:0) {#if selected === PAGE.map5}
    function create_if_block_1(ctx) {
    	let h1;
    	let t1;
    	let button;
    	let t2;
    	let button_nextpage_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Map 5";
    			t1 = space();
    			button = element("button");
    			t2 = text("Nav Menu");
    			add_location(h1, file, 96, 1, 2048);
    			attr_dev(button, "nextpage", button_nextpage_value = ctx.PAGE.start);
    			add_location(button, file, 98, 1, 2065);
    			dispose = listen_dev(button, "click", ctx.gotoPage, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(96:0) {#if selected === PAGE.map5}",
    		ctx
    	});

    	return block;
    }

    // (103:0) {#if selected === PAGE.end}
    function create_if_block(ctx) {
    	let h1;
    	let t1;
    	let button;
    	let t2;
    	let button_nextpage_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "The End.";
    			t1 = space();
    			button = element("button");
    			t2 = text("Nav Menu");
    			add_location(h1, file, 103, 1, 2174);
    			attr_dev(button, "nextpage", button_nextpage_value = ctx.PAGE.start);
    			add_location(button, file, 105, 1, 2194);
    			dispose = listen_dev(button, "click", ctx.gotoPage, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(103:0) {#if selected === PAGE.end}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let if_block7_anchor;
    	let if_block0 = ctx.selected == ctx.PAGE.welcome && create_if_block_8(ctx);
    	let if_block1 = ctx.selected == ctx.PAGE.start && create_if_block_6(ctx);
    	let if_block2 = ctx.selected == ctx.PAGE.map1 && create_if_block_5(ctx);
    	let if_block3 = ctx.selected == ctx.PAGE.map2 && create_if_block_4(ctx);
    	let if_block4 = ctx.selected === ctx.PAGE.map3 && create_if_block_3(ctx);
    	let if_block5 = ctx.selected === ctx.PAGE.map4 && create_if_block_2(ctx);
    	let if_block6 = ctx.selected === ctx.PAGE.map5 && create_if_block_1(ctx);
    	let if_block7 = ctx.selected === ctx.PAGE.end && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			if (if_block5) if_block5.c();
    			t5 = space();
    			if (if_block6) if_block6.c();
    			t6 = space();
    			if (if_block7) if_block7.c();
    			if_block7_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block6) if_block6.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			if (if_block7) if_block7.m(target, anchor);
    			insert_dev(target, if_block7_anchor, anchor);
    		},
    		p: function update(changed, ctx) {
    			if (ctx.selected == ctx.PAGE.welcome) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.selected == ctx.PAGE.start) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (ctx.selected == ctx.PAGE.map1) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    				} else {
    					if_block2 = create_if_block_5(ctx);
    					if_block2.c();
    					if_block2.m(t2.parentNode, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (ctx.selected == ctx.PAGE.map2) {
    				if (if_block3) {
    					if_block3.p(changed, ctx);
    				} else {
    					if_block3 = create_if_block_4(ctx);
    					if_block3.c();
    					if_block3.m(t3.parentNode, t3);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (ctx.selected === ctx.PAGE.map3) {
    				if (if_block4) {
    					if_block4.p(changed, ctx);
    				} else {
    					if_block4 = create_if_block_3(ctx);
    					if_block4.c();
    					if_block4.m(t4.parentNode, t4);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (ctx.selected === ctx.PAGE.map4) {
    				if (if_block5) {
    					if_block5.p(changed, ctx);
    				} else {
    					if_block5 = create_if_block_2(ctx);
    					if_block5.c();
    					if_block5.m(t5.parentNode, t5);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (ctx.selected === ctx.PAGE.map5) {
    				if (if_block6) {
    					if_block6.p(changed, ctx);
    				} else {
    					if_block6 = create_if_block_1(ctx);
    					if_block6.c();
    					if_block6.m(t6.parentNode, t6);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (ctx.selected === ctx.PAGE.end) {
    				if (if_block7) {
    					if_block7.p(changed, ctx);
    				} else {
    					if_block7 = create_if_block(ctx);
    					if_block7.c();
    					if_block7.m(if_block7_anchor.parentNode, if_block7_anchor);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block6) if_block6.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (if_block7) if_block7.d(detaching);
    			if (detaching) detach_dev(if_block7_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const PAGE = {
    		"welcome": 1,
    		"start": 2,
    		"map1": 3,
    		"map2": 4,
    		"map3": 5,
    		"map4": 6,
    		"map5": 7,
    		"end": 10
    	};

    	const navOptions = [
    		{
    			id: PAGE.welcome,
    			text: `Welcome to Overpass`
    		},
    		{ id: PAGE.start, text: `Getting Started` },
    		{ id: PAGE.map1, text: `Map 1` },
    		{ id: PAGE.map2, text: `Map 2` },
    		{ id: PAGE.map3, text: `Map 3` },
    		{ id: PAGE.map4, text: `Map 4` },
    		{ id: PAGE.map5, text: `Map 5` },
    		{ id: PAGE.end, text: `About the Author` }
    	];

    	let selected = PAGE.welcome;
    	let answer = "";

    	function gotoPage(e) {
    		$$invalidate("selected", selected = e.target.getAttribute("nextpage"));
    	}

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate("selected", selected);
    		$$invalidate("navOptions", navOptions);
    	}

    	const change_handler = () => $$invalidate("answer", answer = "");

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate("selected", selected = $$props.selected);
    		if ("answer" in $$props) $$invalidate("answer", answer = $$props.answer);
    	};

    	return {
    		PAGE,
    		navOptions,
    		selected,
    		answer,
    		gotoPage,
    		select_change_handler,
    		change_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
