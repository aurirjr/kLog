export class FG_arrays {

  //http://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
  //Usar somente se pode excluir as arrays anteriores...
  static intersection_destructive(a, b)
  {
    var result = [];
    while( a.length > 0 && b.length > 0 )
    {
      if      (a[0] < b[0] ){ a.shift(); }
      else if (a[0] > b[0] ){ b.shift(); }
      else /* they're equal */
      {
        result.push(a.shift());
        b.shift();
      }
    }

    return result;
  }

  //http://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
  static intersect_safe(a, b)
  {
    var ai=0, bi=0;
    var result = [];

    while( ai < a.length && bi < b.length )
    {
      if      (a[ai] < b[bi] ){ ai++; }
      else if (a[ai] > b[bi] ){ bi++; }
      else /* they're equal */
      {
        result.push(a[ai]);
        ai++;
        bi++;
      }
    }

    return result;
  }

}
