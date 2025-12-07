<?php

namespace App\Filament\Resources\Mapel;

use App\Filament\Resources\Mapel\Pages\CreateMapel;
use App\Filament\Resources\Mapel\Pages\EditMapel;
use App\Filament\Resources\Mapel\Pages\ListMapel;
use App\Filament\Resources\Mapel\Schemas\MapelForm;
use App\Filament\Resources\Mapel\Tables\MapelTable;
use App\Models\Mapel;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class MapelResource extends Resource
{
    protected static ?string $model = Mapel::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBookOpen;

    protected static ?string $navigationLabel = 'Mata Pelajaran';

    protected static ?string $modelLabel = 'Mata Pelajaran';

    protected static ?string $pluralModelLabel = 'Mata Pelajaran';

    protected static ?int $navigationSort = 2;
    
    protected static bool $shouldRegisterNavigation = true;

    public static function form(Schema $schema): Schema
    {
        return MapelForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return MapelTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListMapel::route('/'),
            'create' => CreateMapel::route('/create'),
            'edit' => EditMapel::route('/{record}/edit'),
        ];
    }
}
