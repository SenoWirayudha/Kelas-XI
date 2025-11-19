<?php

namespace App\Filament\Resources\GuruMengajar;

use App\Filament\Resources\GuruMengajar\Pages\CreateGuruMengajar;
use App\Filament\Resources\GuruMengajar\Pages\EditGuruMengajar;
use App\Filament\Resources\GuruMengajar\Pages\ListGuruMengajar;
use App\Filament\Resources\GuruMengajar\Schemas\GuruMengajarForm;
use App\Filament\Resources\GuruMengajar\Tables\GuruMengajarTable;
use App\Models\GuruMengajar;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class GuruMengajarResource extends Resource
{
    protected static ?string $model = GuruMengajar::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentList;

    protected static ?string $navigationLabel = 'Guru Mengajar';

    protected static ?string $modelLabel = 'Guru Mengajar';

    protected static ?string $pluralModelLabel = 'Guru Mengajar';

    protected static ?int $navigationSort = 5;

    public static function form(Schema $schema): Schema
    {
        return GuruMengajarForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return GuruMengajarTable::configure($table);
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
            'index' => ListGuruMengajar::route('/'),
            'create' => CreateGuruMengajar::route('/create'),
            'edit' => EditGuruMengajar::route('/{record}/edit'),
        ];
    }
}
