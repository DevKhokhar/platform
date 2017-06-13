<?php

/**
 * Ushahidi Post Geometry Repository
 *
 * @author     Ushahidi Team <team@ushahidi.com>
 * @package    Ushahidi\Application
 * @copyright  2014 Ushahidi
 * @license    https://www.gnu.org/licenses/agpl-3.0.html GNU Affero General Public License Version 3 (AGPL3)
 */

namespace Ushahidi\App\Repository\Post;

use Ushahidi\Core\Entity\PostValue;
use Ushahidi\Core\Entity\PostValueRepository as PostValueRepositoryContract;
use Symm\Gisconverter\Decoders\WKT;
use Symm\Gisconverter\Geometry\Point;
use Symm\Gisconverter\Exceptions\InvalidText;

class PointRepository extends ValueRepository
{
	protected $decoder;

	public function __construct(\Ohanzee\Database $db, WKT $decoder)
	{
		$this->db = $db;
		$this->decoder = $decoder;
	}

	// OhanzeeRepository
	protected function getTable()
	{
		return 'post_point';
	}

	// OhanzeeRepository
	public function getEntity(array $data = null)
	{
		try {
			$geometry = $this->decoder->geomFromText($data['value']);
			if ($geometry instanceof Point) {
				$data['value'] = ['lon' => $geometry->lon, 'lat' => $geometry->lat];
			}
		} catch (InvalidText $e) {
			$data['value'] = ['lon' => null, 'lat' => null];
		}

		return new PostValue($data);
	}

	// Override selectQuery to fetch 'value' from db as text
	protected function selectQuery(array $where = [])
	{
		$query = parent::selectQuery($where);

		// Get geometry value as text
		$query->select(
				$this->getTable().'.*',
				// Fetch AsText(value) aliased to value
				[\Ohanzee\DB::expr('AsText(value)'), 'value']
			);

		return $query;
	}

	private function normalizeValue($value)
	{
		if (is_array($value)) {
			$value = array_map('floatval', $value);
			$value = \Ohanzee\DB::expr("GeomFromText('POINT(lon lat)')")->parameters($value);
		} else {
			$value = null;
		}

		return $value;
	}

	// Override createValue to save 'value' using GeomFromText
	public function createValue($value, $form_attribute_id, $post_id)
	{
		return parent::createValue($this->normalizeValue($value), $form_attribute_id, $post_id);
	}

	// Override updateValue to save 'value' using GeomFromText
	public function updateValue($id, $value)
	{
		return parent::updateValue($id, $this->normalizeValue($value));
	}
}
