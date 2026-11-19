<form method="post" action="/signup" novalidate>
    @csrf
    <label for="name">Name</label>
    <input id="name" name="name" value="{{ old('name') }}" required>
    @error('name') <p class="error">{{ $message }}</p> @enderror

    <label for="email">Email</label>
    <input id="email" name="email" type="email" value="{{ old('email') }}" required>
    @error('email') <p class="error">{{ $message }}</p> @enderror

    @if (session('email_suggestion'))
        {{-- Resubmits the form with the corrected address (the last "email" value wins). --}}
        <button type="submit" name="email" value="{{ session('email_suggestion') }}" formnovalidate>
            Use {{ session('email_suggestion') }}
        </button>
    @endif

    <button type="submit">Create my account</button>
</form>
