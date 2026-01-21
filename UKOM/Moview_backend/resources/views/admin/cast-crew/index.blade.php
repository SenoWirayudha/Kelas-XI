@extends('layouts.admin')

@section('title', 'Cast & Crew Management')
@section('page-title', 'Cast & Crew Management')
@section('page-subtitle', 'Manage actors, directors, and crew members')

@section('content')
<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Total People</p>
                <p class="text-3xl font-bold text-gray-800">487</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-user-friends text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Actors</p>
                <p class="text-3xl font-bold text-purple-600">342</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
                <i class="fas fa-theater-masks text-purple-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Directors</p>
                <p class="text-3xl font-bold text-blue-600">87</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-video text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Writers</p>
                <p class="text-3xl font-bold text-green-600">58</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
                <i class="fas fa-pen text-green-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Search & Filters -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800">Cast & Crew List</h3>
        <a href="/admin/cast-crew/add" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center">
            <i class="fas fa-plus mr-2"></i>
            Add Person
        </a>
    </div>
    <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
            <div class="relative">
                <input type="text" placeholder="Search by name..." 
                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
        </div>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Roles</option>
            <option>Actor</option>
            <option>Director</option>
            <option>Writer</option>
            <option>Producer</option>
            <option>Cinematographer</option>
            <option>Composer</option>
            <option>Other</option>
        </select>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Sort: Name (A-Z)</option>
            <option>Sort: Name (Z-A)</option>
            <option>Sort: Most Films</option>
            <option>Sort: Recently Added</option>
        </select>
    </div>
</div>

<!-- Cast & Crew Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
    @php
        $people = [
            [
                'name' => 'Tim Robbins', 
                'role' => 'Actor', 
                'films' => 45, 
                'known_for' => 'The Shawshank Redemption', 
                'photo' => 'https://image.tmdb.org/t/p/w200/hsCuROGEzJAULGgxQS8Y9JzB0gH.jpg',
                'bio' => 'Timothy Francis Robbins is an American actor and filmmaker. He is known for his portrayal of Andy Dufresne in the prison drama film The Shawshank Redemption (1994).',
                'nationality' => 'American',
                'dob' => 'October 16, 1958'
            ],
            [
                'name' => 'Morgan Freeman', 
                'role' => 'Actor', 
                'films' => 89, 
                'known_for' => 'The Shawshank Redemption', 
                'photo' => 'https://image.tmdb.org/t/p/w200/jPsLqiYGSofU4s6BjrxnefMfabb.jpg',
                'bio' => 'Morgan Freeman is an American actor, director, and narrator. Noted for his distinctive deep voice, he is known for his various roles in a wide variety of film genres.',
                'nationality' => 'American',
                'dob' => 'June 1, 1937'
            ],
            [
                'name' => 'Frank Darabont', 
                'role' => 'Director', 
                'films' => 12, 
                'known_for' => 'The Shawshank Redemption', 
                'photo' => 'https://image.tmdb.org/t/p/w200/7LqmE3p1XTwCdNCOmBxovq210Qk.jpg',
                'bio' => 'Frank Árpad Darabont is a Hungarian-American film director, screenwriter and producer. He has been nominated for three Academy Awards and a Golden Globe Award.',
                'nationality' => 'American',
                'dob' => 'January 28, 1959'
            ],
            [
                'name' => 'Stephen King', 
                'role' => 'Writer', 
                'films' => 67, 
                'known_for' => 'The Shining', 
                'photo' => 'https://image.tmdb.org/t/p/w200/cqH5caPdVS0kPUCDoJPCqvza5h3.jpg',
                'bio' => 'Stephen Edwin King is an American author of horror, supernatural fiction, suspense, crime, science-fiction, and fantasy novels. His books have sold more than 350 million copies.',
                'nationality' => 'American',
                'dob' => 'September 21, 1947'
            ],
            [
                'name' => 'Al Pacino', 
                'role' => 'Actor', 
                'films' => 78, 
                'known_for' => 'The Godfather', 
                'photo' => 'https://image.tmdb.org/t/p/w200/2dGBb1fOcNdZjtQToVPFxXjm4ke.jpg',
                'bio' => 'Alfredo James Pacino is an American actor and filmmaker. In a career spanning over five decades, he has received numerous accolades including an Academy Award.',
                'nationality' => 'American',
                'dob' => 'April 25, 1940'
            ],
            [
                'name' => 'Christopher Nolan', 
                'role' => 'Director', 
                'films' => 15, 
                'known_for' => 'Inception', 
                'photo' => 'https://image.tmdb.org/t/p/w200/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
                'bio' => 'Christopher Edward Nolan is a British-American film director, producer, and screenwriter. His films have grossed more than US$5 billion worldwide and garnered 11 Academy Awards.',
                'nationality' => 'British-American',
                'dob' => 'July 30, 1970'
            ],
            [
                'name' => 'Leonardo DiCaprio', 
                'role' => 'Actor', 
                'films' => 52, 
                'known_for' => 'Inception', 
                'photo' => 'https://image.tmdb.org/t/p/w200/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg',
                'bio' => 'Leonardo Wilhelm DiCaprio is an American actor and film producer. Known for his work in biographical and period films, he is the recipient of numerous accolades.',
                'nationality' => 'American',
                'dob' => 'November 11, 1974'
            ],
            [
                'name' => 'Quentin Tarantino', 
                'role' => 'Director', 
                'films' => 18, 
                'known_for' => 'Pulp Fiction', 
                'photo' => 'https://image.tmdb.org/t/p/w200/1gjcpAa99FAOWGnrUvHEXXsRs7o.jpg',
                'bio' => 'Quentin Jerome Tarantino is an American film director, screenwriter, producer, and actor. His films are characterized by nonlinear storylines and aestheticization of violence.',
                'nationality' => 'American',
                'dob' => 'March 27, 1963'
            ],
            [
                'name' => 'Christian Bale', 
                'role' => 'Actor', 
                'films' => 42, 
                'known_for' => 'The Dark Knight', 
                'photo' => 'https://image.tmdb.org/t/p/w200/3qx2QFUbG6t6IlzR0F9k3Z6Yhf7.jpg',
                'bio' => 'Christian Charles Philip Bale is an English actor. Known for his versatility and physical transformations for his roles, he has been a leading man in films of several genres.',
                'nationality' => 'British',
                'dob' => 'January 30, 1974'
            ],
            [
                'name' => 'Hans Zimmer', 
                'role' => 'Composer', 
                'films' => 156, 
                'known_for' => 'Inception', 
                'photo' => 'https://image.tmdb.org/t/p/w200/tW4nNx84ux4B8J3AXqkAqPqIKWR.jpg',
                'bio' => 'Hans Florian Zimmer is a German film score composer and music producer. He has won two Oscars and four Grammys, and has been nominated for two Emmys and a Tony.',
                'nationality' => 'German',
                'dob' => 'September 12, 1957'
            ],
            [
                'name' => 'Robert De Niro', 
                'role' => 'Actor', 
                'films' => 112, 
                'known_for' => 'The Godfather Part II', 
                'photo' => 'https://image.tmdb.org/t/p/w200/cT8htcckIuyI1Lqwt1CvD02ynTh.jpg',
                'bio' => 'Robert Anthony De Niro Jr. is an American actor and producer. He is particularly known for his nine collaborations with filmmaker Martin Scorsese.',
                'nationality' => 'American',
                'dob' => 'August 17, 1943'
            ],
            [
                'name' => 'Martin Scorsese', 
                'role' => 'Director', 
                'films' => 34, 
                'known_for' => 'Goodfellas', 
                'photo' => 'https://image.tmdb.org/t/p/w200/52dXePIBKfqBDEDqX96B1tKKFdA.jpg',
                'bio' => 'Martin Charles Scorsese is an American film director, producer, screenwriter, and actor. One of the major figures of the New Hollywood era, he is widely regarded as one of the greatest directors of all time.',
                'nationality' => 'American',
                'dob' => 'November 17, 1942'
            ],
        ];
    @endphp
    
    @foreach($people as $person)
    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
        <div class="relative">
            <img src="{{ $person['photo'] }}" alt="{{ $person['name'] }}" class="w-full h-80 object-cover">
            <div class="absolute top-2 right-2">
                <span class="px-3 py-1 text-xs font-semibold rounded-full 
                    {{ $person['role'] === 'Actor' ? 'bg-purple-500 text-white' : 
                       ($person['role'] === 'Director' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white') }}">
                    {{ $person['role'] }}
                </span>
            </div>
        </div>
        <div class="p-4">
            <h3 class="font-bold text-lg mb-1">{{ $person['name'] }}</h3>
            <p class="text-gray-600 text-sm mb-3">{{ $person['films'] }} films</p>
            
            <div class="flex space-x-2">
                <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm" onclick="alert('View details (UI only)')">
                    <i class="fas fa-eye mr-1"></i> View
                </button>
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm" onclick="alert('Edit (UI only)')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm" onclick="alert('Delete (UI only)')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>
    @endforeach
</div>

<!-- Table View Alternative -->
<div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-6 border-b">
        <h3 class="text-lg font-bold">All Cast & Crew Members</h3>
    </div>
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Known For</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Bio</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @foreach($people as $person)
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <img src="{{ $person['photo'] }}" alt="{{ $person['name'] }}" class="w-16 h-16 rounded-lg object-cover shadow">
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-gray-900">{{ $person['name'] }}</div>
                    <div class="text-xs text-gray-500">{{ $person['nationality'] ?? '-' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {{ $person['role'] === 'Actor' ? 'bg-purple-100 text-purple-800' : 
                           ($person['role'] === 'Director' ? 'bg-blue-100 text-blue-800' : 
                           ($person['role'] === 'Writer' ? 'bg-green-100 text-green-800' : 
                           ($person['role'] === 'Composer' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'))) }}">
                        <i class="fas {{ $person['role'] === 'Actor' ? 'fa-theater-masks' : ($person['role'] === 'Director' ? 'fa-video' : ($person['role'] === 'Writer' ? 'fa-pen' : 'fa-music')) }} mr-1"></i>
                        {{ $person['role'] }}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">{{ $person['known_for'] }}</div>
                    <div class="text-xs text-gray-500">{{ $person['films'] }} films</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-600 max-w-md line-clamp-2">
                        {{ Str::limit($person['bio'], 120) }}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        <button class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50" title="View Details" onclick="alert('View details (UI only)')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded hover:bg-indigo-50" title="Edit" onclick="alert('Edit (UI only)')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<!-- Pagination -->
<div class="mt-6 flex justify-between items-center">
    <p class="text-sm text-gray-600">Showing 1 to 12 of 487 results</p>
    <div class="flex space-x-2">
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" disabled>Previous</button>
        <button class="px-3 py-1 bg-blue-600 text-white rounded">1</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">2</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">3</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">...</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">41</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">Next</button>
    </div>
</div>
@endsection
