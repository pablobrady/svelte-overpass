<script>
	const PAGE = {
		'welcome': 1,
		'start': 2,
		'map1': 3,
		'map2': 4,
		'map3': 5,
		'map4': 6,
		'map5': 7,
		'end': 10
	}

	const navOptions = [
		{ id: PAGE.welcome, text: `Welcome to Overpass` },
		{ id: PAGE.start, text: `Getting Started` },
		{ id: PAGE.map1, text: `Map 1` },
		{ id: PAGE.map2, text: `Map 2` },
		{ id: PAGE.map3, text: `Map 3` },
		{ id: PAGE.map4, text: `Map 4` },
		{ id: PAGE.map5, text: `Map 5` },
		{ id: PAGE.end,  text: `About the Author` }
	]

	let selected = PAGE.welcome;
	let answer = '';

	
	function gotoPage(e) {
		selected = e.target.getAttribute("nextpage")
	}

	function selectAView() {
		
	}

	function handleSubmit() {
		alert(`answered question ${selected.id} (${selected.text}) with "${answer}"`);
	}
</script>

<style>
	input { display: block; width: 500px; max-width: 100%; }
</style>


{#if selected == PAGE.welcome}
	<h1>Welcome to Overpass</h1>
	<button on:click="{gotoPage}" nextpage="{PAGE.start}">Get Started</button>
{/if}


{#if selected == PAGE.start}
	<h1>Getting Started?</h1>
	<select bind:value={selected} on:change="{() => answer = ''}">
		<option value=0 default>Select a View</option>
		{#each navOptions as navOption}
			{#if navOption.id > PAGE.start}
				<option value={navOption.id}>
					{navOption.text}
				</option>
			{/if}
		{/each}
	</select>
	<p>selected navOption {selected ? selected.id : '[waiting...]'}</p>
{/if}

{#if selected == PAGE.map1}
	<h1>Map 1 - Diamond Interchange</h1>

	<button on:click="{gotoPage}" nextpage="{PAGE.start}">Nav Menu</button>
	<!-- < Nav Menu / > -->
{/if}


{#if selected == PAGE.map2}
	<h1>Map 2 - Tight Diamond Interchange</h1>

	<button on:click="{gotoPage}" nextpage="{PAGE.start}">Nav Menu</button>
{/if}


{#if selected === PAGE.map3}
	<h1>Map 3</h1>

	<button on:click="{gotoPage}" nextpage="{PAGE.start}">Nav Menu</button>
{/if}


{#if selected === PAGE.map4}
	<h1>Map 4 - Diverging Diamond Interchange</h1>

	<button on:click="{gotoPage}" nextpage="{PAGE.start}">Nav Menu</button>
{/if}


{#if selected === PAGE.map5}
	<h1>Map 5</h1>

	<button on:click="{gotoPage}" nextpage="{PAGE.start}">Nav Menu</button>
{/if}


{#if selected === PAGE.end}
	<h1>The End.</h1>

	<button on:click="{gotoPage}" nextpage="{PAGE.start}">Nav Menu</button>
{/if}